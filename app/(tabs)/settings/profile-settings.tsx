import React from "react";
import { View, Text, ScrollView, Image } from "react-native";
import { useAuth } from "@/lib/contexts/AuthContext";
import { UserIcon } from "lucide-react-native";
import { AnimatedTabScreen } from "@/components/AnimatedTabScreen";

function ProfileSettingsScreen() {
  const { user } = useAuth();

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="bg-white p-6 mb-2">
        <View className="items-center mb-6">
          <View className="bg-blue-100 rounded-full w-24 h-24 items-center justify-center overflow-hidden">
            {user?.image_url ? (
              <Image
                source={{ uri: user.image_url }}
                className="w-24 h-24 rounded-full"
                style={{ width: 96, height: 96 }}
              />
            ) : (
              <UserIcon size={48} color="#0086c9" />
            )}
          </View>
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

      <View className="bg-white p-6">
        <Text className="text-gray-500 text-center text-sm">
          Profile editing coming soon
        </Text>
      </View>
    </ScrollView>
  );
}

export default function ProfileSettingsScreenWrapper() {
  return (
    <AnimatedTabScreen>
      <ProfileSettingsScreen />
    </AnimatedTabScreen>
  );
}
