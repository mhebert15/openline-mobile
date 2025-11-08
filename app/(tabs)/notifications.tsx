import React from "react";
import { View, Text, ScrollView } from "react-native";
import { AnimatedTabScreen } from "@/components/AnimatedTabScreen";

function NotificationsScreen() {
  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="p-6">
        <Text className="text-2xl font-bold text-gray-900 mb-2">
          Notifications
        </Text>
        <Text className="text-gray-600">
          You're all caught up! We'll let you know when there's something new to
          review.
        </Text>
      </View>
    </ScrollView>
  );
}

export default function NotificationsScreenWrapper() {
  return (
    <AnimatedTabScreen>
      <NotificationsScreen />
    </AnimatedTabScreen>
  );
}
