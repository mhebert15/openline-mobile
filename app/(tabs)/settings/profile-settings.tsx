import React, { useState, useEffect, useRef, useContext } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  TextInput,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
// @ts-ignore - base64-arraybuffer doesn't have TypeScript definitions
import { decode } from "base64-arraybuffer";
import { useAuth } from "@/lib/contexts/AuthContext";
import { UserIcon, PencilIcon, X } from "lucide-react-native";
import { AnimatedTabScreen } from "@/components/AnimatedTabScreen";
import { supabase } from "@/lib/supabase/client";
import {
  useToast,
  Toast,
  ToastTitle,
  ToastDescription,
} from "@/components/ui/toast";
import {
  BottomSheet,
  BottomSheetPortal,
  BottomSheetContent,
  BottomSheetBackdrop,
  BottomSheetDragIndicator,
  BottomSheetScrollView,
  BottomSheetContext,
} from "@/components/ui/bottomsheet";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import { setOpenEditSheetFn } from "@/lib/utils/edit-sheet-utils";

// Inner component that has access to BottomSheet context
function ProfileSettingsContent({
  onReady,
}: {
  onReady?: (openFn: () => void) => void;
}) {
  const { user, refreshProfile } = useAuth();
  const toast = useToast();
  const router = useRouter();
  const params = useLocalSearchParams<{ openEdit?: string }>();
  const [uploading, setUploading] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(
    user?.image_url || null
  );
  const [editFullName, setEditFullName] = useState(user?.full_name || "");
  const [editPhone, setEditPhone] = useState(user?.phone || "");
  const [saving, setSaving] = useState(false);

  // Access BottomSheetContext
  const bottomSheetContext = useContext(BottomSheetContext) as {
    handleOpen: () => void;
    handleClose: () => void;
  } | null;

  const { handleOpen, handleClose } = bottomSheetContext || {
    handleOpen: () => {
      console.warn(
        "BottomSheet context not available - handleOpen called but context is null"
      );
    },
    handleClose: () => {},
  };

  // Expose open function to parent and global
  useEffect(() => {
    console.log("Setting handleOpen function:", handleOpen);
    if (onReady) {
      onReady(handleOpen);
    }
    // Also set global function for layout to access
    setOpenEditSheetFn(handleOpen);
    console.log("handleOpen set in global state");
    return () => {
      setOpenEditSheetFn(null);
    };
  }, [handleOpen, onReady]);

  // Listen for openEdit param to open the bottom sheet
  useFocusEffect(
    React.useCallback(() => {
      if (params.openEdit === "true") {
        handleOpen();
        router.setParams({ openEdit: undefined });
      }
    }, [params.openEdit, router, handleOpen])
  );

  // Also watch for param changes with useEffect (in case screen is already focused)
  useEffect(() => {
    if (params.openEdit === "true") {
      handleOpen();
      router.setParams({ openEdit: undefined });
    }
  }, [params.openEdit, router, handleOpen]);

  // Update imageUri when user changes
  useEffect(() => {
    setImageUri(user?.image_url || null);
  }, [user?.image_url]);

  // Update edit fields when user changes
  useEffect(() => {
    setEditFullName(user?.full_name || "");
    setEditPhone(user?.phone || "");
  }, [user]);

  const requestPermissions = async () => {
    if (Platform.OS !== "web") {
      const { status: cameraStatus } =
        await ImagePicker.requestCameraPermissionsAsync();
      const { status: libraryStatus } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (cameraStatus !== "granted" || libraryStatus !== "granted") {
        Alert.alert(
          "Permissions Required",
          "Please grant camera and photo library permissions to upload a profile photo."
        );
        return false;
      }
    }
    return true;
  };

  const pickImage = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    Alert.alert(
      "Select Photo",
      "Choose an option",
      [
        {
          text: "Camera",
          onPress: () => openCamera(),
        },
        {
          text: "Photo Library",
          onPress: () => openImageLibrary(),
        },
        {
          text: "Cancel",
          style: "cancel",
        },
      ],
      { cancelable: true }
    );
  };

  const openCamera = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0] && result.assets[0].base64) {
        await uploadImage(result.assets[0].uri, result.assets[0].base64);
      }
    } catch (error) {
      console.error("Error opening camera:", error);
      Alert.alert("Error", "Failed to open camera");
    }
  };

  const openImageLibrary = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0] && result.assets[0].base64) {
        await uploadImage(result.assets[0].uri, result.assets[0].base64);
      }
    } catch (error) {
      console.error("Error opening image library:", error);
      Alert.alert("Error", "Failed to open photo library");
    }
  };

  const handleSaveProfile = async () => {
    if (!user?.id) {
      toast.show({
        placement: "top",
        render: ({ id }) => {
          return (
            <Toast nativeID={`toast-${id}`} action="error" variant="solid">
              <ToastTitle>Error</ToastTitle>
              <ToastDescription>User not found</ToastDescription>
            </Toast>
          );
        },
      });
      return;
    }

    try {
      setSaving(true);

      const updates: any = {};
      if (editFullName !== user.full_name) {
        updates.full_name = editFullName;
      }
      if (editPhone !== user.phone) {
        updates.phone = editPhone || null;
      }

      if (Object.keys(updates).length === 0) {
        handleClose();
        return;
      }

      const { error } = await (supabase
        .from("profiles")
        .update(updates as never)
        .eq("id", user.id) as any);

      if (error) {
        throw error;
      }

      await refreshProfile();
      handleClose();

      toast.show({
        placement: "top",
        render: ({ id }) => {
          return (
            <Toast nativeID={`toast-${id}`} action="success" variant="solid">
              <ToastTitle>Profile Updated</ToastTitle>
              <ToastDescription>
                Your profile has been successfully updated.
              </ToastDescription>
            </Toast>
          );
        },
      });
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast.show({
        placement: "top",
        render: ({ id }) => {
          return (
            <Toast nativeID={`toast-${id}`} action="error" variant="solid">
              <ToastTitle>Update Failed</ToastTitle>
              <ToastDescription>
                {error.message || "Failed to update profile. Please try again."}
              </ToastDescription>
            </Toast>
          );
        },
      });
    } finally {
      setSaving(false);
    }
  };

  const uploadImage = async (uri: string, base64: string | undefined) => {
    if (!user?.id) {
      Alert.alert("Error", "User not found");
      return;
    }

    if (!base64) {
      Alert.alert("Error", "Failed to process image data");
      return;
    }

    try {
      setUploading(true);

      // Create a unique filename
      const fileExt = uri.split(".").pop() || "jpg";
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = fileName;

      // Convert base64 to ArrayBuffer for Supabase Storage
      const arrayBuffer = decode(base64);

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("profile-images")
        .upload(filePath, arrayBuffer, {
          contentType: `image/${fileExt}`,
          upsert: true,
        });

      if (uploadError) {
        // If bucket doesn't exist, provide helpful error message
        if (uploadError.message.includes("Bucket not found")) {
          toast.show({
            placement: "top",
            render: ({ id }) => {
              return (
                <Toast nativeID={`toast-${id}`} action="error" variant="solid">
                  <ToastTitle>Storage Not Configured</ToastTitle>
                  <ToastDescription>
                    The profile-images storage bucket needs to be created in
                    Supabase. Please create a public bucket named
                    'profile-images' in your Supabase Storage settings.
                  </ToastDescription>
                </Toast>
              );
            },
          });
          setUploading(false);
          return;
        } else {
          throw uploadError;
        }
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("profile-images").getPublicUrl(filePath);

      // Update profile in database
      const { error: updateError } = await (supabase
        .from("profiles")
        .update({ image_url: publicUrl } as never)
        .eq("id", user.id) as any);

      if (updateError) {
        throw updateError;
      }

      // Update local state
      setImageUri(publicUrl);

      // Refresh user profile from AuthContext to get updated image_url
      await refreshProfile();

      // Show success toast
      toast.show({
        placement: "top",
        render: ({ id }) => {
          return (
            <Toast nativeID={`toast-${id}`} action="success" variant="solid">
              <ToastTitle>Profile Image Updated</ToastTitle>
              <ToastDescription>
                Your profile image has been successfully updated.
              </ToastDescription>
            </Toast>
          );
        },
      });
    } catch (error: any) {
      console.error("Error uploading image:", error);

      // Show error toast
      toast.show({
        placement: "top",
        render: ({ id }) => {
          return (
            <Toast nativeID={`toast-${id}`} action="error" variant="solid">
              <ToastTitle>Upload Failed</ToastTitle>
              <ToastDescription>
                {error.message || "Failed to upload image. Please try again."}
              </ToastDescription>
            </Toast>
          );
        },
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <ScrollView className="flex-1 bg-gray-50">
        <View className="bg-white p-6 mb-2">
          <View className="items-center mb-6">
            <TouchableOpacity
              onPress={pickImage}
              disabled={uploading}
              activeOpacity={0.8}
              className="relative"
            >
              <View className="bg-blue-100 rounded-full w-24 h-24 items-center justify-center overflow-hidden">
                {uploading ? (
                  <ActivityIndicator size="large" color="#0086c9" />
                ) : imageUri ? (
                  <Image
                    source={{ uri: imageUri }}
                    className="w-24 h-24 rounded-full"
                    style={{ width: 96, height: 96 }}
                  />
                ) : (
                  <UserIcon size={48} color="#0086c9" />
                )}
              </View>
              {/* Pencil icon overlay */}
              <View
                className="absolute bottom-0 right-0 bg-white rounded-full items-center justify-center border-2 border-white"
                style={{
                  width: 32,
                  height: 32,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.25,
                  shadowRadius: 3.84,
                  elevation: 5,
                }}
              >
                <PencilIcon size={16} color="#0086c9" />
              </View>
            </TouchableOpacity>
          </View>
          <Text className="text-lg font-semibold text-gray-900 mb-4">
            Profile Information
          </Text>

          <View className="mb-4">
            <Text className="text-sm text-gray-500 mb-1">Full Name</Text>
            <Text className="text-base text-gray-900">{user?.full_name}</Text>
          </View>

          <View className="mb-4">
            <Text className="text-sm text-gray-500 mb-1">Email</Text>
            <Text className="text-base text-gray-900">{user?.email}</Text>
          </View>

          <View className="mb-4">
            <Text className="text-sm text-gray-500 mb-1">Phone</Text>
            <Text className="text-base text-gray-900">
              {user?.phone || "Not provided"}
            </Text>
          </View>

          <View className="mb-4">
            <Text className="text-sm text-gray-500 mb-1">User Type</Text>
            <Text className="text-base text-gray-900 capitalize">
              {user?.user_type?.replace("_", " ")}
            </Text>
          </View>
        </View>
      </ScrollView>

      <BottomSheetPortal
        snapPoints={["90%"]}
        backdropComponent={BottomSheetBackdrop}
        handleComponent={BottomSheetDragIndicator}
      >
        <BottomSheetContent className="flex-1 bg-white">
          <BottomSheetScrollView className="flex-1">
            {/* Header */}
            <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-200">
              <TouchableOpacity onPress={handleClose} className="p-2">
                <X size={24} color="#111827" />
              </TouchableOpacity>
              <Text className="text-lg font-semibold text-gray-900">
                Edit Profile
              </Text>
              <TouchableOpacity
                onPress={handleSaveProfile}
                disabled={saving}
                className="p-2"
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#0086c9" />
                ) : (
                  <Text
                    style={{
                      color: "#0086c9",
                      fontWeight: "600",
                      fontSize: 16,
                    }}
                  >
                    Save
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Profile Image Section */}
            <View className="items-center py-8">
              <View className="bg-blue-100 rounded-full w-32 h-32 items-center justify-center overflow-hidden mb-4">
                {uploading ? (
                  <ActivityIndicator size="large" color="#0086c9" />
                ) : imageUri ? (
                  <Image
                    source={{ uri: imageUri }}
                    className="w-32 h-32 rounded-full"
                    style={{ width: 128, height: 128 }}
                  />
                ) : (
                  <UserIcon size={64} color="#0086c9" />
                )}
              </View>
              <TouchableOpacity
                onPress={pickImage}
                disabled={uploading}
                className="px-6 py-2 bg-gray-100 rounded-lg"
              >
                <Text className="text-base font-medium text-gray-900">
                  Edit Photo
                </Text>
              </TouchableOpacity>
            </View>

            {/* Personal Information Section */}
            <View className="px-4 pb-6">
              <Text className="text-sm font-semibold text-gray-700 mb-4">
                Personal information
              </Text>

              {/* Full Name Field */}
              <View className="mb-6">
                <Text className="text-sm text-gray-600 mb-2">Full name</Text>
                <TextInput
                  value={editFullName}
                  onChangeText={setEditFullName}
                  placeholder="Enter full name"
                  className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-base text-gray-900"
                  style={{
                    backgroundColor: "#F9FAFB",
                    borderColor: "#E5E7EB",
                    borderRadius: 8,
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    fontSize: 16,
                    color: "#111827",
                  }}
                />
              </View>

              {/* Phone Field */}
              <View className="mb-6">
                <Text className="text-sm text-gray-600 mb-2">Phone</Text>
                <TextInput
                  value={editPhone}
                  onChangeText={setEditPhone}
                  placeholder="Enter phone number"
                  keyboardType="phone-pad"
                  className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-base text-gray-900"
                  style={{
                    backgroundColor: "#F9FAFB",
                    borderColor: "#E5E7EB",
                    borderRadius: 8,
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    fontSize: 16,
                    color: "#111827",
                  }}
                />
              </View>
            </View>
          </BottomSheetScrollView>
        </BottomSheetContent>
      </BottomSheetPortal>
    </>
  );
}

// Global state to trigger bottom sheet open
let openEditSheetCallback: (() => void) | null = null;

function ProfileSettingsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ openEdit?: string }>();

  // Watch for params and open sheet
  useEffect(() => {
    if (params.openEdit === "true" && openEditSheetCallback) {
      openEditSheetCallback();
      router.setParams({ openEdit: undefined });
    }
  }, [params.openEdit, router]);

  return (
    <BottomSheet>
      <ProfileSettingsContent
        onReady={(openFn) => {
          openEditSheetCallback = openFn;
        }}
      />
    </BottomSheet>
  );
}

export default function ProfileSettingsScreenWrapper() {
  return (
    <AnimatedTabScreen>
      <ProfileSettingsScreen />
    </AnimatedTabScreen>
  );
}
