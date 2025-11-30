import React from "react";
import { View, Text, ScrollView } from "react-native";
import { AnimatedTabScreen } from "@/components/AnimatedTabScreen";

function NotificationSettingsScreen() {
  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="bg-white p-6 mb-2">
        <Text className="text-lg font-semibold text-gray-900 mb-4">
          Notification Preferences
        </Text>

        <Text className="text-gray-500 text-sm mb-4">
          Manage how you receive notifications for meetings, messages, and
          updates.
        </Text>
      </View>

      <View className="bg-white p-6">
        <Text className="text-gray-500 text-center text-sm">
          Notification settings coming soon
        </Text>
      </View>
    </ScrollView>
  );
}

export default function NotificationSettingsScreenWrapper() {
  return (
    <AnimatedTabScreen>
      <NotificationSettingsScreen />
    </AnimatedTabScreen>
  );
}
