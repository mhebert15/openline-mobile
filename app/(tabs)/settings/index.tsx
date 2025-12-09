import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
} from "react-native";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useRouter } from "expo-router";
import {
  UserIcon,
  BellIcon,
  ShieldIcon,
  HelpCircleIcon,
  LogOutIcon,
  Pill,
} from "lucide-react-native";
import { AnimatedTabScreen } from "@/components/AnimatedTabScreen";
import { useTabBarHeight } from "@/hooks/useTabBarHeight";

function SettingsScreen() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const tabBarHeight = useTabBarHeight();

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await signOut();
          router.replace("/(auth)/sign-in");
        },
      },
    ]);
  };

  return (
    <ScrollView
      className="flex-1 bg-gray-50"
      contentContainerStyle={{
        paddingBottom: tabBarHeight + 16, // Tab bar height + extra padding
      }}
    >
      {/* User Profile Section */}
      <View className="bg-white p-6 mb-2">
        <View className="items-center">
          <View className="bg-blue-100 rounded-full w-20 h-20 items-center justify-center mb-3 overflow-hidden">
            {user?.image_url ? (
              <Image
                source={{ uri: user.image_url }}
                className="w-20 h-20 rounded-full"
                style={{ width: 80, height: 80 }}
              />
            ) : (
              <UserIcon size={40} color="#0086c9" />
            )}
          </View>
          <Text className="text-xl font-bold text-gray-900">
            {user?.full_name}
          </Text>
          <Text className="text-gray-600">{user?.email}</Text>
          <View className="mt-2 bg-blue-50 px-3 py-1 rounded-full">
            <Text
              className="text-sm font-medium capitalize"
              style={{ color: "#0086c9" }}
            >
              {user?.user_type?.replace("_", " ")}
            </Text>
          </View>
        </View>
      </View>

      {/* Settings Options */}
      <View className="bg-white mb-2">
        <SettingsItem
          icon={<UserIcon size={24} color="#6b7280" />}
          title="Profile Settings"
          onPress={() => router.push("/(tabs)/settings/profile-settings")}
        />
        {user?.user_type === "medical_rep" && (
          <SettingsItem
            icon={<Pill size={24} color="#6b7280" />}
            title="Medications"
            onPress={() => router.push("/(tabs)/settings/medications")}
          />
        )}
        <SettingsItem
          icon={<BellIcon size={24} color="#6b7280" />}
          title="Notification Settings"
          onPress={() => router.push("/(tabs)/settings/notification-settings")}
        />
        {/* <SettingsItem
          icon={<ShieldIcon size={24} color="#6b7280" />}
          title="Privacy & Security"
          onPress={() => router.push("/(tabs)/settings/privacy-security")}
        /> */}
      </View>

      {/* Support Section */}
      <View className="bg-white mb-2">
        <SettingsItem
          icon={<HelpCircleIcon size={24} color="#6b7280" />}
          title="Help & Support"
          onPress={() => router.push("/(tabs)/settings/help-support")}
        />
      </View>

      {/* Sign Out */}
      <View className="bg-white mb-2">
        <SettingsItem
          icon={<LogOutIcon size={24} color="#ef4444" />}
          title="Sign Out"
          titleClassName="text-red-600"
          onPress={handleSignOut}
        />
      </View>

      {/* App Version */}
      <View className="p-6">
        <Text className="text-center text-gray-500 text-sm">
          Openline v1.0.0
        </Text>
      </View>
    </ScrollView>
  );
}

interface SettingsItemProps {
  icon: React.ReactNode;
  title: string;
  titleClassName?: string;
  onPress: () => void;
}

function SettingsItem({
  icon,
  title,
  titleClassName,
  onPress,
}: SettingsItemProps) {
  return (
    <TouchableOpacity
      className="flex-row items-center px-6 py-4 border-b border-gray-100"
      onPress={onPress}
    >
      <View className="mr-4">{icon}</View>
      <Text className={`flex-1 text-base ${titleClassName || "text-gray-900"}`}>
        {title}
      </Text>
      <Text className="text-gray-400">›</Text>
    </TouchableOpacity>
  );
}

export default function SettingsScreenWrapper() {
  return (
    <AnimatedTabScreen>
      <SettingsScreen />
    </AnimatedTabScreen>
  );
}
