import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
} from "react-native";
import { MailIcon, MessageCircleIcon, FileTextIcon } from "lucide-react-native";
import { AnimatedTabScreen } from "@/components/AnimatedTabScreen";

function HelpSupportScreen() {
  const handleContactSupport = () => {
    Linking.openURL("mailto:support@openline.com");
  };

  const handleOpenDocs = () => {
    // Placeholder for documentation link
    Alert.alert("Documentation", "Documentation coming soon!");
  };

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="bg-white mb-2">
        <TouchableOpacity
          className="flex-row items-center px-6 py-4 border-b border-gray-100"
          onPress={handleContactSupport}
        >
          <View className="mr-4">
            <MailIcon size={24} color="#6b7280" />
          </View>
          <Text className="flex-1 text-base text-gray-900">
            Contact Support
          </Text>
          <Text className="text-gray-400">›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="flex-row items-center px-6 py-4 border-b border-gray-100"
          onPress={() => {
            // Placeholder for FAQ
            Alert.alert("FAQ", "Frequently asked questions coming soon!");
          }}
        >
          <View className="mr-4">
            <MessageCircleIcon size={24} color="#6b7280" />
          </View>
          <Text className="flex-1 text-base text-gray-900">
            Frequently Asked Questions
          </Text>
          <Text className="text-gray-400">›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="flex-row items-center px-6 py-4"
          onPress={handleOpenDocs}
        >
          <View className="mr-4">
            <FileTextIcon size={24} color="#6b7280" />
          </View>
          <Text className="flex-1 text-base text-gray-900">Documentation</Text>
          <Text className="text-gray-400">›</Text>
        </TouchableOpacity>
      </View>

      <View className="bg-white p-6 mb-2">
        <Text className="text-sm text-gray-500">
          Need help? Contact our support team or check out our documentation for
          more information.
        </Text>
      </View>
    </ScrollView>
  );
}

export default function HelpSupportScreenWrapper() {
  return (
    <AnimatedTabScreen>
      <HelpSupportScreen />
    </AnimatedTabScreen>
  );
}
