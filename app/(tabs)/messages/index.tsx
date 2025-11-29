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
import { supabase } from "@/lib/supabase/client";
import type { Message } from "@/lib/types/database.types";
import { format } from "date-fns";
import { MessageCircleIcon, PlusIcon } from "lucide-react-native";
import { AnimatedTabScreen } from "@/components/AnimatedTabScreen";
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

  // Group messages by conversation (location_id + other participant)
  const groupedConversations = useMemo(() => {
    if (!user || messages.length === 0) return [];

    // Create a map to group messages by location_id + other participant ID
    const conversationMap = new Map<
      string,
      {
        locationId: string;
        participantId: string;
        participant: any;
        location: any;
        messages: Message[];
        mostRecentMessage: Message;
        unreadCount: number;
      }
    >();

    messages.forEach((message) => {
      const otherParticipant = getOtherParticipant(message);
      if (!otherParticipant) return;

      // Create a unique key for this conversation: location_id + participant_id
      const conversationKey = `${message.location_id}_${otherParticipant.id}`;

      if (!conversationMap.has(conversationKey)) {
        conversationMap.set(conversationKey, {
          locationId: message.location_id,
          participantId: otherParticipant.id,
          participant: otherParticipant,
          location: message.location,
          messages: [],
          mostRecentMessage: message,
          unreadCount: 0,
        });
      }

      const conversation = conversationMap.get(conversationKey)!;
      conversation.messages.push(message);

      // Update most recent message if this one is newer
      const currentTime = new Date(
        message.sent_at || message.created_at
      ).getTime();
      const mostRecentTime = new Date(
        conversation.mostRecentMessage.sent_at ||
          conversation.mostRecentMessage.created_at
      ).getTime();
      if (currentTime > mostRecentTime) {
        conversation.mostRecentMessage = message;
      }

      // Count unread messages (sent by other participant, not read by current user)
      if (
        message.sender_profile_id === otherParticipant.id &&
        !message.read_at
      ) {
        conversation.unreadCount++;
      }
    });

    // Convert map to array and sort by most recent message time (newest first)
    return Array.from(conversationMap.values()).sort((a, b) => {
      const aTime = new Date(
        a.mostRecentMessage.sent_at || a.mostRecentMessage.created_at
      ).getTime();
      const bTime = new Date(
        b.mostRecentMessage.sent_at || b.mostRecentMessage.created_at
      ).getTime();
      return bTime - aTime;
    });
  }, [messages, user]);

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

  const handleConversationPress = async (conversation: {
    locationId: string;
    participantId: string;
    participant: any;
    location: any;
    messages: Message[];
    mostRecentMessage: Message;
    unreadCount: number;
  }) => {
    // Mark all unread messages in this conversation as read
    if (conversation.unreadCount > 0) {
      const unreadMessages = conversation.messages.filter(
        (msg) =>
          msg.sender_profile_id === conversation.participantId && !msg.read_at
      );

      if (unreadMessages.length > 0) {
        const messageIds = unreadMessages.map((msg) => msg.id);
        const { error: updateError } = await supabase
          .from("messages")
          .update({ read_at: new Date().toISOString() } as unknown as never)
          .in("id", messageIds);

        if (updateError) {
          console.error("Error marking messages read:", updateError);
        } else {
          // Refresh messages cache to reflect the read status
          prefetchTabData("messages").catch((error) =>
            console.error("Error prefetching messages:", error)
          );
        }
      }
    }

    // Navigate to message detail with conversation params
    router.push({
      pathname: "/(tabs)/messages/message-detail",
      params: {
        locationId: conversation.locationId,
        locationName: conversation.location?.name || "Message",
        participantId: conversation.participantId,
        participantName: conversation.participant.full_name,
      },
    });
  };

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
          {groupedConversations.length === 0 ? (
            <View className="p-8 items-center">
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
            groupedConversations.map((conversation) => {
              const locationName =
                conversation.location?.name || "Unknown Location";
              const participantName =
                conversation.participant?.full_name || "Unknown";
              const hasUnread = conversation.unreadCount > 0;
              const mostRecentTime =
                conversation.mostRecentMessage.sent_at ||
                conversation.mostRecentMessage.created_at;

              return (
                <TouchableOpacity
                  key={`${conversation.locationId}_${conversation.participantId}`}
                  className={`bg-white rounded-xl p-4 mb-3 shadow-sm ${
                    hasUnread ? "border-l-4" : ""
                  }`}
                  style={hasUnread ? { borderLeftColor: "#0086c9" } : undefined}
                  onPress={() => handleConversationPress(conversation)}
                >
                  <View className="flex-row justify-between items-start mb-2">
                    <View className="flex-1">
                      <Text className="text-lg font-semibold text-gray-900">
                        {locationName}
                      </Text>
                    </View>
                    {hasUnread && (
                      <View className="flex-row items-center">
                        {conversation.unreadCount > 1 && (
                          <Text className="text-xs text-white bg-blue-600 rounded-full px-2 py-1 mr-2">
                            {conversation.unreadCount}
                          </Text>
                        )}
                        <View
                          className="rounded-full w-2 h-2 mt-2"
                          style={{ backgroundColor: "#0086c9" }}
                        />
                      </View>
                    )}
                  </View>

                  <Text className="text-gray-700 mb-2" numberOfLines={2}>
                    {conversation.mostRecentMessage.body}
                  </Text>

                  <View className="flex-row justify-between items-center">
                    <Text className="text-sm text-gray-500">
                      {participantName}
                    </Text>
                    <Text className="text-sm text-gray-500">
                      {format(new Date(mostRecentTime), "MMM d, h:mm a")}
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
