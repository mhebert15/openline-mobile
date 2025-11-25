import React, { useEffect, useMemo, useState } from "react";
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
import { mockAdminUsers, mockMessages, mockCurrentUser } from "@/lib/mock/data";
import { useComposeSheet } from "@/lib/contexts/ComposeSheetContext";

function MessagesScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const { cache, prefetchTabData, invalidateTab, isLoading } = useDataCache();
  const [refreshing, setRefreshing] = useState(false);
  const { openComposeSheet } = useComposeSheet();

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

  const getOtherParticipant = (message: Message) => {
    // Message has sender and recipient - return the one that's not the current user
    if (message.sender?.id === user?.id && message.recipient) {
      return message.recipient;
    } else if (message.recipient?.id === user?.id && message.sender) {
      return message.sender;
    }
    return message.recipient || message.sender || null;
  };

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
    const otherParticipant = getOtherParticipant(message);

    if (!otherParticipant) {
      return;
    }

    const isUnread = message.sender_profile_id !== user?.id && !message.read_at;
    if (isUnread) {
      mockMessagesService
        .markAsRead(message.id)
        .catch((error) => console.error("Error marking message read:", error));
      prefetchTabData("messages").catch((error) =>
        console.error("Error prefetching messages:", error)
      );
    }

    // Navigate to message detail with conversation params
    router.push({
      pathname: "/(tabs)/messages/message-detail",
      params: {
        locationId: message.location_id,
        locationName: message.location?.name || "Message",
        participantId: otherParticipant.id,
        participantName: otherParticipant.full_name,
      },
    });
  };

  const existingConversationParticipantIds = useMemo(() => {
    const ids = new Set<string>();
    messages.forEach((message) => {
      if (message.sender?.id && message.sender.id !== user?.id) {
        ids.add(message.sender.id);
      }
      if (message.recipient?.id && message.recipient.id !== user?.id) {
        ids.add(message.recipient.id);
      }
    });
    return ids;
  }, [messages, user?.id]);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#0086c9" />
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
              <TouchableOpacity className="mt-4" onPress={openComposeSheet}>
                <Text className="font-semibold" style={{ color: "#0086c9" }}>
                  Send your first message
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            messages.map((message) => {
              const otherParticipant = getOtherParticipant(message);
              const otherName = otherParticipant?.full_name || "You";
              const locationName = message.location?.name || "Unknown Location";
              const isUnread =
                message.sender_profile_id !== user?.id && !message.read_at;

              return (
                <TouchableOpacity
                  key={message.id}
                  className={`bg-white rounded-xl p-4 mb-3 shadow-sm ${
                    isUnread ? "border-l-4" : ""
                  }
                  style={
                    isUnread
                      ? { borderLeftColor: "#0086c9" }
                      : undefined
                  }`}
                  onPress={() => handleMessagePress(message)}
                >
                  <View className="flex-row justify-between items-start mb-2">
                    <View className="flex-1">
                      <Text className="text-lg font-semibold text-gray-900">
                        {locationName}
                      </Text>
                    </View>
                    {isUnread && (
                      <View
                        className="rounded-full w-2 h-2 mt-2"
                        style={{ backgroundColor: "#0086c9" }}
                      />
                    )}
                  </View>

                  <Text className="text-gray-700 mb-2" numberOfLines={2}>
                    {message.body}
                  </Text>

                  <View className="flex-row justify-between items-center">
                    <Text className="text-sm text-gray-500">{otherName}</Text>
                    <Text className="text-sm text-gray-500">
                      {format(
                        new Date(message.sent_at || message.created_at),
                        "MMM d, h:mm a"
                      )}
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
        className="absolute bottom-6 right-6 rounded-full w-14 h-14 items-center justify-center shadow-lg"
        style={{ backgroundColor: "#0086c9" }}
        onPress={openComposeSheet}
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
