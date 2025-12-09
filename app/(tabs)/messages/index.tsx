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
import { format, isToday, isYesterday, parseISO } from "date-fns";
import { MessageCircleIcon, PlusIcon } from "lucide-react-native";
import { AnimatedTabScreen } from "@/components/AnimatedTabScreen";
import { useComposeSheet } from "@/lib/contexts/ComposeSheetContext";
import { useTabBarHeight } from "@/hooks/useTabBarHeight";

function MessagesScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const tabBarHeight = useTabBarHeight();
  const { cache, prefetchTabData, invalidateTab, isLoading } = useDataCache();
  const [refreshing, setRefreshing] = useState(false);
  const { openComposeSheet } = useComposeSheet();

  // Get data from cache - memoize to prevent infinite loops
  const messages = useMemo(
    () => (cache.messages.messages.data as Message[]) || [],
    [cache.messages.messages.data]
  );

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

  // Fetch message_reads for current user to determine read status
  const [messageReads, setMessageReads] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user || messages.length === 0) {
      setMessageReads((prev) => {
        // Only update if the Set is not already empty
        if (prev.size === 0) return prev;
        return new Set();
      });
      return;
    }

    const fetchReadStatus = async () => {
      const messageIds = messages.map((msg) => msg.id);
      if (messageIds.length === 0) return;

      const { data: readsData } = await supabase
        .from("message_reads")
        .select("message_id")
        .eq("profile_id", user.id)
        .in("message_id", messageIds);

      const readSet = new Set(
        (readsData || []).map((read: any) => read.message_id)
      );
      setMessageReads((prev) => {
        // Only update if the Set actually changed
        if (
          prev.size === readSet.size &&
          Array.from(prev).every((id) => readSet.has(id))
        ) {
          return prev;
        }
        return readSet;
      });
    };

    fetchReadStatus();
  }, [messages, user]);

  // Group messages by conversation (location_id + other participant for direct, location_id for broadcast)
  const groupedConversations = useMemo(() => {
    if (!user || messages.length === 0) return [];

    // Create a map to group messages
    const conversationMap = new Map<
      string,
      {
        locationId: string;
        participantId?: string; // undefined for broadcast messages
        participant?: any; // undefined for broadcast messages
        location: any;
        messages: Message[];
        mostRecentMessage: Message;
        unreadCount: number;
        messageType: "direct" | "location_broadcast";
      }
    >();

    messages.forEach((message) => {
      if (message.message_type === "location_broadcast") {
        // Broadcast messages: group by location_id only
        const conversationKey = `broadcast_${message.location_id}`;

        if (!conversationMap.has(conversationKey)) {
          conversationMap.set(conversationKey, {
            locationId: message.location_id,
            participantId: undefined,
            participant: undefined,
            location: message.location,
            messages: [],
            mostRecentMessage: message,
            unreadCount: 0,
            messageType: "location_broadcast",
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

        // Count unread messages (not sent by current user, not in messageReads)
        if (
          message.sender_profile_id !== user.id &&
          !messageReads.has(message.id)
        ) {
          conversation.unreadCount++;
        }
      } else {
        // Direct messages: group by location_id + other participant
        const otherParticipant = getOtherParticipant(message);
        if (!otherParticipant) return;

        const conversationKey = `direct_${message.location_id}_${otherParticipant.id}`;

        if (!conversationMap.has(conversationKey)) {
          conversationMap.set(conversationKey, {
            locationId: message.location_id,
            participantId: otherParticipant.id,
            participant: otherParticipant,
            location: message.location,
            messages: [],
            mostRecentMessage: message,
            unreadCount: 0,
            messageType: "direct",
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

        // Count unread messages (sent by other participant, not in messageReads)
        if (
          message.sender_profile_id === otherParticipant.id &&
          !messageReads.has(message.id)
        ) {
          conversation.unreadCount++;
        }
      }
    });

    // Ensure mostRecentMessage is actually the most recent by sorting messages in each conversation
    conversationMap.forEach((conversation) => {
      // Sort messages by time (newest first) and take the first one
      const sortedMessages = [...conversation.messages].sort((a, b) => {
        const aTime = new Date(a.sent_at || a.created_at).getTime();
        const bTime = new Date(b.sent_at || b.created_at).getTime();
        return bTime - aTime; // Descending order (newest first)
      });
      conversation.mostRecentMessage = sortedMessages[0];
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
  }, [messages, user, messageReads]);

  // Group conversations by date
  const groupConversationsByDate = (
    conversations: typeof groupedConversations
  ): { date: string; conversations: typeof groupedConversations }[] => {
    const groups: Record<string, typeof groupedConversations> = {};

    conversations.forEach((conversation) => {
      const date = parseISO(
        conversation.mostRecentMessage.sent_at ||
          conversation.mostRecentMessage.created_at
      );
      let groupKey: string;

      if (isToday(date)) {
        groupKey = "Today";
      } else if (isYesterday(date)) {
        groupKey = "Yesterday";
      } else {
        groupKey = format(date, "MMMM d, yyyy");
      }

      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(conversation);
    });

    return Object.entries(groups).map(([date, conversations]) => ({
      date,
      conversations,
    }));
  };

  const groupedByDate = groupConversationsByDate(groupedConversations);

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
    participantId?: string;
    participant?: any;
    location: any;
    messages: Message[];
    mostRecentMessage: Message;
    unreadCount: number;
    messageType: "direct" | "location_broadcast";
  }) => {
    // Mark all unread messages in this conversation as read
    if (conversation.unreadCount > 0 && user) {
      const unreadMessages = conversation.messages.filter(
        (msg) => msg.sender_profile_id !== user.id && !messageReads.has(msg.id)
      );

      if (unreadMessages.length > 0) {
        const readsToInsert = unreadMessages.map((msg) => ({
          message_id: msg.id,
          profile_id: user.id,
          read_at: new Date().toISOString(),
        }));

        const { error: insertError } = await supabase
          .from("message_reads")
          .insert(readsToInsert as any);

        if (insertError) {
          console.error("Error marking messages read:", insertError);
        } else {
          // Update local read status
          const newReads = new Set(messageReads);
          unreadMessages.forEach((msg) => newReads.add(msg.id));
          setMessageReads(newReads);

          // Refresh messages cache to reflect the read status
          prefetchTabData("messages").catch((error) =>
            console.error("Error prefetching messages:", error)
          );
        }
      }
    }

    // Navigate to message detail with conversation params
    const params: any = {
      locationId: conversation.locationId,
      locationName: conversation.location?.name || "Message",
    };

    // Only include participantId for direct messages
    if (conversation.messageType === "direct" && conversation.participantId) {
      params.participantId = conversation.participantId;
      params.participantName = conversation.participant?.full_name;
    }

    router.push({
      pathname: "/(tabs)/messages/message-detail",
      params,
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
        contentContainerStyle={{
          paddingBottom: tabBarHeight + 16, // Tab bar height + extra padding
        }}
      >
        <View>
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
            <View className="p-4">
              {groupedByDate.map((group) => (
                <View key={group.date} className="mb-6">
                  <Text className="text-sm font-semibold text-gray-500 mb-3 px-2">
                    {group.date}
                  </Text>
                  {group.conversations.map((conversation) => {
                    const locationName =
                      conversation.location?.name || "Unknown Location";
                    const participantName =
                      conversation.messageType === "location_broadcast"
                        ? "Location Broadcast"
                        : conversation.participant?.full_name || "Unknown";
                    const hasUnread = conversation.unreadCount > 0;

                    // For direct messages: show participant name at top, location below
                    // For broadcast messages: show location name at top, "Location Broadcast" below
                    const topName =
                      conversation.messageType === "location_broadcast"
                        ? locationName
                        : participantName;
                    const bottomName =
                      conversation.messageType === "location_broadcast"
                        ? participantName
                        : locationName;

                    return (
                      <TouchableOpacity
                        key={
                          conversation.messageType === "location_broadcast"
                            ? `broadcast_${conversation.locationId}`
                            : `direct_${conversation.locationId}_${conversation.participantId}`
                        }
                        className={`bg-white rounded-lg p-4 mb-2 border ${
                          hasUnread ? "border-blue-200" : "border-gray-200"
                        }`}
                        activeOpacity={0.7}
                        onPress={() => handleConversationPress(conversation)}
                      >
                        <View className="flex-row items-start">
                          {hasUnread && (
                            <View className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3" />
                          )}
                          <View className="flex-1">
                            <View className="flex-row items-start justify-between mb-1">
                              <Text
                                className={`text-base font-semibold ${
                                  hasUnread ? "text-gray-900" : "text-gray-700"
                                }`}
                                style={{ flex: 1 }}
                              >
                                {topName}
                              </Text>
                              {hasUnread && conversation.unreadCount > 1 && (
                                <Text className="text-xs text-white bg-blue-600 rounded-full px-2 py-1 ml-2">
                                  {conversation.unreadCount}
                                </Text>
                              )}
                            </View>
                            <Text
                              className={`text-sm mb-1 ${
                                hasUnread ? "text-gray-700" : "text-gray-600"
                              }`}
                              numberOfLines={2}
                            >
                              {conversation.mostRecentMessage.body}
                            </Text>
                            <Text className="text-xs text-gray-500">
                              {bottomName}
                            </Text>
                          </View>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Floating Action Button - positioned above tab bar */}
      <TouchableOpacity
        className="absolute right-6 rounded-full w-14 h-14 items-center justify-center shadow-lg"
        style={{
          backgroundColor: "#0086c9",
          bottom: tabBarHeight + 16, // Position above tab bar with padding
        }}
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
