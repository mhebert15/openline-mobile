import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useDataCache } from "@/lib/contexts/DataCacheContext";
import { mockMessagesService } from "@/lib/mock/services";
import type { Message } from "@/lib/types/database.types";
import { format } from "date-fns";
import { MessageCircleIcon, PlusIcon } from "lucide-react-native";
import { AnimatedTabScreen } from "@/components/AnimatedTabScreen";

function MessagesScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const { cache, prefetchTabData, invalidateTab, isLoading } = useDataCache();
  const [refreshing, setRefreshing] = useState(false);

  // Get data from cache
  const messages = (cache.messages.messages.data as Message[]) || [];

  // Only show loader if cache is empty AND currently loading
  const loading = isLoading("messages") && messages.length === 0;

  // Background refresh if cache is stale or empty
  useEffect(() => {
    if (user && !cache.messages.messages.data) {
      prefetchTabData("messages").catch((error) => {
        console.error("Error loading messages:", error);
      });
    }
  }, [user, cache.messages.messages.data, prefetchTabData]);

  const onRefresh = async () => {
    setRefreshing(true);
    invalidateTab("messages");
    try {
      await prefetchTabData("messages");
    } catch (error) {
      console.error("Error refreshing messages:", error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleMessagePress = async (message: Message) => {
    // Mark as read if recipient
    if (message.recipient_id === user?.id && !message.read) {
      await mockMessagesService.markAsRead(message.id);
      // Refresh messages after marking as read
      await prefetchTabData("messages");
    }

    // Determine the other person in the conversation
    const isRecipient = message.recipient_id === user?.id;
    const otherPerson = isRecipient ? message.sender : message.recipient;

    // Navigate to message detail with conversation params
    router.push({
      pathname: "/(tabs)/messages/message-detail",
      params: {
        officeId: message.office_id,
        recipientId: otherPerson?.id || "",
        recipientName: otherPerson?.full_name || "Unknown",
      },
    });
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View className="p-4">
          {messages.length === 0 ? (
            <View className="bg-white rounded-xl p-8 items-center">
              <MessageCircleIcon size={48} color="#9ca3af" />
              <Text className="text-gray-500 mt-4 text-center">
                No messages yet
              </Text>
              <TouchableOpacity
                className="mt-4"
                onPress={() => router.push("/compose-message")}
              >
                <Text className="text-blue-600 font-semibold">
                  Send your first message
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            messages.map((message) => {
              const isRecipient = message.recipient_id === user?.id;
              const otherPerson = isRecipient
                ? message.sender
                : message.recipient;

              return (
                <TouchableOpacity
                  key={message.id}
                  className={`bg-white rounded-xl p-4 mb-3 shadow-sm ${
                    isRecipient && !message.read
                      ? "border-l-4 border-blue-600"
                      : ""
                  }`}
                  onPress={() => handleMessagePress(message)}
                >
                  <View className="flex-row justify-between items-start mb-2">
                    <View className="flex-1">
                      <Text className="text-lg font-semibold text-gray-900">
                        {message.subject}
                      </Text>
                      <Text className="text-sm text-gray-600 mt-1">
                        {isRecipient ? "From" : "To"}: {otherPerson?.full_name}
                      </Text>
                    </View>
                    {isRecipient && !message.read && (
                      <View className="bg-blue-600 rounded-full w-2 h-2 mt-2" />
                    )}
                  </View>

                  <Text className="text-gray-700 mb-2" numberOfLines={2}>
                    {message.content}
                  </Text>

                  <View className="flex-row justify-between items-center">
                    <Text className="text-sm text-gray-500">
                      {message.office?.name}
                    </Text>
                    <Text className="text-sm text-gray-500">
                      {format(new Date(message.created_at), "MMM d, h:mm a")}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity
        className="absolute bottom-6 right-6 bg-blue-600 rounded-full w-14 h-14 items-center justify-center shadow-lg"
        onPress={() => router.push("/compose-message")}
      >
        <PlusIcon size={28} color="white" />
      </TouchableOpacity>
    </View>
  );
}

export default function MessagesScreenWrapper() {
  return (
    <AnimatedTabScreen>
      <MessagesScreen />
    </AnimatedTabScreen>
  );
}
