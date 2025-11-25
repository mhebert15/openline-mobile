import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter, Stack } from "expo-router";
import { mockMessagesService, mockOfficesService } from "@/lib/mock/services";
import type { User, MedicalOffice } from "@/lib/types/database.types";
import { ArrowLeftIcon, CheckIcon } from "lucide-react-native";

export default function ComposeMessageScreen() {
  const router = useRouter();
  const [offices, setOffices] = useState<MedicalOffice[]>([]);
  const [adminUsers, setAdminUsers] = useState<User[]>([]);
  const [selectedLocation, setSelectedLocation] =
    useState<MedicalOffice | null>(null);
  const [selectedRecipient, setSelectedRecipient] = useState<User | null>(null);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showOfficePicker, setShowOfficePicker] = useState(false);
  const [showRecipientPicker, setShowRecipientPicker] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [officesData, adminsData] = await Promise.all([
        mockOfficesService.getAllOffices(),
        mockMessagesService.getAdminUsers(),
      ]);
      setOffices(officesData);
      setAdminUsers(adminsData);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!selectedRecipient || !selectedLocation || !body.trim()) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    setSending(true);
    try {
      await mockMessagesService.sendMessage(
        selectedRecipient.id,
        selectedLocation.id,
        body
      );

      Alert.alert("Success", "Message sent successfully", [
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      console.error("Error sending message:", error);
      Alert.alert("Error", "Failed to send message. Please try again.");
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#0086c9" />
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: "New Message",
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} className="mr-4">
              <ArrowLeftIcon size={24} color="#111827" />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity
              onPress={handleSend}
              disabled={sending}
              className="ml-4"
            >
              {sending ? (
                <ActivityIndicator size="small" color="#0086c9" />
              ) : (
                <Text className="font-semibold" style={{ color: "#0086c9" }}>
                  Send
                </Text>
              )}
            </TouchableOpacity>
          ),
        }}
      />
      <ScrollView className="flex-1 bg-gray-50">
        <View className="bg-white p-4 border-b border-gray-200">
          {/* Office Picker */}
          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-2">
              Select Office
            </Text>
            <TouchableOpacity
              className="border border-gray-300 rounded-lg px-4 py-3"
              onPress={() => setShowOfficePicker(!showOfficePicker)}
            >
              <Text
                className={selectedLocation ? "text-gray-900" : "text-gray-400"}
              >
                {selectedLocation?.name || "Choose a location..."}
              </Text>
            </TouchableOpacity>

            {showOfficePicker && (
              <View className="mt-2 border border-gray-200 rounded-lg">
                {offices.map((office) => (
                  <TouchableOpacity
                    key={office.id}
                    className="px-4 py-3 border-b border-gray-100 flex-row items-center justify-between"
                    onPress={() => {
                      setSelectedLocation(office);
                      setShowOfficePicker(false);
                    }}
                  >
                    <Text className="text-gray-900">{office.name}</Text>
                    {selectedLocation?.id === office.id && (
                      <CheckIcon size={20} color="#0086c9" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Recipient Picker */}
          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-2">
              To (Admin Staff)
            </Text>
            <TouchableOpacity
              className="border border-gray-300 rounded-lg px-4 py-3"
              onPress={() => setShowRecipientPicker(!showRecipientPicker)}
            >
              <Text
                className={
                  selectedRecipient ? "text-gray-900" : "text-gray-400"
                }
              >
                {selectedRecipient?.full_name || "Choose a recipient..."}
              </Text>
            </TouchableOpacity>

            {showRecipientPicker && (
              <View className="mt-2 border border-gray-200 rounded-lg">
                {adminUsers.map((admin) => (
                  <TouchableOpacity
                    key={admin.id}
                    className="px-4 py-3 border-b border-gray-100 flex-row items-center justify-between"
                    onPress={() => {
                      setSelectedRecipient(admin);
                      setShowRecipientPicker(false);
                    }}
                  >
                    <View>
                      <Text className="text-gray-900 font-medium">
                        {admin.full_name}
                      </Text>
                      <Text className="text-gray-600 text-sm">
                        {admin.email}
                      </Text>
                    </View>
                    {selectedRecipient?.id === admin.id && (
                      <CheckIcon size={20} color="#0086c9" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Subject */}
          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-2">
              Subject
            </Text>
            <TextInput className="border border-gray-300 rounded-lg px-4 py-3 text-base" />
          </View>
        </View>

        {/* Message Content */}
        <View className="bg-white p-4 mt-2">
          <Text className="text-sm font-medium text-gray-700 mb-2">
            Message
          </Text>
          <TextInput
            className="border border-gray-300 rounded-lg px-4 py-3 text-base min-h-[200px]"
            placeholder="Type your message here..."
            value={body}
            onChangeText={setBody}
            multiline
            textAlignVertical="top"
          />
        </View>
      </ScrollView>
    </>
  );
}
