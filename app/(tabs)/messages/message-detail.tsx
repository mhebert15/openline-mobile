import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useAuth } from "@/lib/contexts/AuthContext";
import { supabase } from "@/lib/supabase/client";
import type { Message, Profile } from "@/lib/types/database.types";
import { format } from "date-fns";
import { SendIcon } from "lucide-react-native";
import { useTabBarHeight } from "@/hooks/useTabBarHeight";

export default function MessageDetailScreen() {
  const { locationId, participantId } = useLocalSearchParams<{
    locationId: string;
    locationName?: string;
    participantId?: string;
    participantName?: string;
  }>();
  const { user } = useAuth();
  const tabBarHeight = useTabBarHeight();
  const scrollViewRef = useRef<ScrollView>(null);
  const hasInitiallyScrolledRef = useRef(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [messageText, setMessageText] = useState("");

  useEffect(() => {
    // Reset scroll ref when conversation changes
    hasInitiallyScrolledRef.current = false;
    loadConversation();

    // Set up real-time subscription for new messages
    if (!user || !locationId) return;

    const isDirectMessage = !!participantId;
    const channel = supabase
      .channel(`messages:${locationId}:${participantId || "broadcast"}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `location_id=eq.${locationId}`,
        },
        async (payload) => {
          const newMessage = payload.new as any;

          // Check if message matches current conversation
          const matchesConversation = isDirectMessage
            ? newMessage.message_type === "direct" &&
              ((newMessage.sender_profile_id === user.id &&
                newMessage.recipient_profile_id === participantId) ||
                (newMessage.sender_profile_id === participantId &&
                  newMessage.recipient_profile_id === user.id))
            : newMessage.message_type === "location_broadcast";

          if (matchesConversation) {
            // Check if message already exists (to avoid duplicates from optimistic updates)
            setMessages((prev) => {
              const exists = prev.some((m) => m.id === newMessage.id);
              if (exists) {
                // Message already exists (from optimistic update), skip
                return prev;
              } else {
                // New message from another user, fetch full data with sender/recipient
                // Fetch the full message with sender/recipient info
                supabase
                  .from("messages")
                  .select(
                    "id, location_id, meeting_id, sender_profile_id, recipient_profile_id, body, sent_at, message_type, created_at, updated_at, sender:profiles!messages_sender_profile_id_fkey(id, full_name, email, phone, user_type, status), recipient:profiles!messages_recipient_profile_id_fkey(id, full_name, email, phone, user_type, status)"
                  )
                  .eq("id", newMessage.id)
                  .single()
                  .then(({ data: fullMessage, error }) => {
                    if (!error && fullMessage) {
                      const inserted = fullMessage as any;
                      const messageToAdd: Message = {
                        id: inserted.id,
                        location_id: inserted.location_id,
                        meeting_id: inserted.meeting_id,
                        sender_profile_id: inserted.sender_profile_id,
                        recipient_profile_id: inserted.recipient_profile_id,
                        body: inserted.body,
                        sent_at: inserted.sent_at,
                        message_type: inserted.message_type || "direct",
                        created_at: inserted.created_at,
                        updated_at: inserted.updated_at,
                        sender: inserted.sender
                          ? (inserted.sender as any)
                          : undefined,
                        recipient: inserted.recipient
                          ? (inserted.recipient as any)
                          : undefined,
                      };

                      setMessages((prev) => {
                        // Check again if message exists (race condition)
                        if (prev.some((m) => m.id === messageToAdd.id)) {
                          return prev;
                        }
                        return [...prev, messageToAdd];
                      });

                      // Scroll to bottom when new message arrives
                      setTimeout(() => {
                        scrollViewRef.current?.scrollToEnd({ animated: true });
                      }, 100);
                    }
                  });
                // Return previous state while fetching
                return prev;
              }
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [locationId, participantId, user]);

  const loadConversation = async () => {
    if (!user || !locationId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Determine message type: if participantId exists, it's a direct message conversation
      // Otherwise, it's a location broadcast
      const isDirectMessage = !!participantId;

      let messagesQuery = supabase
        .from("messages")
        .select(
          "id, location_id, meeting_id, sender_profile_id, recipient_profile_id, body, sent_at, message_type, created_at, updated_at, sender:profiles!messages_sender_profile_id_fkey(id, full_name, email, phone, user_type, status), recipient:profiles!messages_recipient_profile_id_fkey(id, full_name, email, phone, user_type, status)"
        )
        .eq("location_id", locationId);

      if (isDirectMessage) {
        // Direct messages: filter by location_id AND participant
        messagesQuery = messagesQuery
          .eq("message_type", "direct")
          .or(
            `and(sender_profile_id.eq.${user.id},recipient_profile_id.eq.${participantId}),and(sender_profile_id.eq.${participantId},recipient_profile_id.eq.${user.id})`
          );
      } else {
        // Broadcast messages: filter by location_id only
        messagesQuery = messagesQuery.eq("message_type", "location_broadcast");
      }

      const { data: messagesData, error: messagesError } =
        await messagesQuery.order("sent_at", { ascending: true });

      if (messagesError) {
        console.error("Error fetching messages:", messagesError);
        setMessages([]);
        setLoading(false);
        return;
      }

      // Fetch message_reads for current user to determine read status
      const messageIds = (messagesData || []).map((msg: any) => msg.id);
      let readStatusMap = new Map<string, boolean>();

      if (messageIds.length > 0) {
        const { data: readsData } = await supabase
          .from("message_reads")
          .select("message_id")
          .eq("profile_id", user.id)
          .in("message_id", messageIds);

        readStatusMap = new Map(
          (readsData || []).map((read: any) => [read.message_id, true])
        );
      }

      // Map the data to match Message interface
      const messagesArray = (messagesData as any[]) || [];
      const messages: Message[] = messagesArray.map((msg: any) => ({
        id: msg.id,
        location_id: msg.location_id,
        meeting_id: msg.meeting_id,
        sender_profile_id: msg.sender_profile_id,
        recipient_profile_id: msg.recipient_profile_id,
        body: msg.body,
        sent_at: msg.sent_at,
        message_type: msg.message_type || "direct",
        created_at: msg.created_at,
        updated_at: msg.updated_at,
        sender: msg.sender ? (msg.sender as any) : undefined,
        recipient: msg.recipient ? (msg.recipient as any) : undefined,
      }));

      setMessages(messages);

      // Mark messages as read when viewing them
      const unreadMessageIds = messageIds.filter(
        (id: string) =>
          !readStatusMap.has(id) &&
          messagesArray.find(
            (m: any) => m.id === id && m.sender_profile_id !== user.id
          )
      );

      if (unreadMessageIds.length > 0) {
        // Insert read records for unread messages
        const readsToInsert = unreadMessageIds.map((messageId: string) => ({
          message_id: messageId,
          profile_id: user.id,
          read_at: new Date().toISOString(),
        }));

        await supabase.from("message_reads").insert(readsToInsert as any);
      }

      // Don't scroll here - let onContentSizeChange handle it after layout
    } catch (error) {
      console.error("Error loading conversation:", error);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    const trimmed = messageText.trim();

    if (!trimmed || !user || !locationId) {
      return;
    }

    // For direct messages, participantId is required
    // For broadcast messages, participantId is not needed
    const isDirectMessage = !!participantId;
    if (isDirectMessage && !participantId) {
      return;
    }

    // Create optimistic message immediately for instant UI feedback
    const tempId = `temp-${Date.now()}`;
    const optimisticMessage: Message = {
      id: tempId,
      location_id: locationId,
      meeting_id: null,
      sender_profile_id: user.id,
      recipient_profile_id: isDirectMessage ? participantId : null,
      body: trimmed,
      sent_at: new Date().toISOString(),
      message_type: isDirectMessage ? "direct" : "location_broadcast",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      sender: user
        ? ({
            id: user.id,
            full_name: user.full_name || "",
            email: user.email || "",
            phone: user.phone || null,
            user_type: user.user_type || "medical_rep",
            status: user.status || "active",
            image_url: null,
            default_company_id: null,
            default_location_id: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          } as Profile)
        : undefined,
      recipient: undefined,
    };

    // Add optimistic message immediately
    setMessages((prev) => [...prev, optimisticMessage]);
    setMessageText("");

    // Scroll to bottom immediately
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 50);

    // Now send to server in the background
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        console.error("No active session found");
        // Remove optimistic message on error
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        return;
      }

      const messageData: any = {
        location_id: locationId,
        sender_profile_id: user.id,
        body: trimmed,
        sent_at: new Date().toISOString(),
        message_type: isDirectMessage ? "direct" : "location_broadcast",
      };

      if (isDirectMessage) {
        messageData.recipient_profile_id = participantId;
      }

      const { data: insertedData, error: insertError } = await supabase
        .from("messages")
        .insert(messageData)
        .select(
          "id, location_id, meeting_id, sender_profile_id, recipient_profile_id, body, sent_at, message_type, created_at, updated_at, sender:profiles!messages_sender_profile_id_fkey(id, full_name, email, phone, user_type, status), recipient:profiles!messages_recipient_profile_id_fkey(id, full_name, email, phone, user_type, status)"
        )
        .single();

      if (insertError) {
        console.error("Error sending message:", insertError);
        // Remove optimistic message on error
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        // Restore message text so user can retry
        setMessageText(trimmed);
        return;
      }

      // Replace optimistic message with real message from server
      if (insertedData) {
        const inserted = insertedData as any;
        const realMessage: Message = {
          id: inserted.id,
          location_id: inserted.location_id,
          meeting_id: inserted.meeting_id,
          sender_profile_id: inserted.sender_profile_id,
          recipient_profile_id: inserted.recipient_profile_id,
          body: inserted.body,
          sent_at: inserted.sent_at,
          message_type: inserted.message_type || "direct",
          created_at: inserted.created_at,
          updated_at: inserted.updated_at,
          sender: inserted.sender ? (inserted.sender as any) : undefined,
          recipient: inserted.recipient
            ? (inserted.recipient as any)
            : undefined,
        };

        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? realMessage : m))
        );
      }
    } catch (error) {
      console.error("Error sending message:", error);
      // Remove optimistic message on error
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      // Restore message text so user can retry
      setMessageText(trimmed);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#0086c9" />
      </View>
    );
  }

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return format(date, "h:mm a");
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday ${format(date, "h:mm a")}`;
    } else {
      return format(date, "MMM d, h:mm a");
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-gray-100"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      {/* Messages ScrollView */}
      <ScrollView
        ref={scrollViewRef}
        className="flex-1 px-4 py-4"
        contentContainerStyle={{
          paddingBottom: tabBarHeight + 80, // Tab bar height + input area height + padding
        }}
        onContentSizeChange={() => {
          if (!hasInitiallyScrolledRef.current && messages.length > 0) {
            // Scroll to end immediately without animation once content is laid out
            requestAnimationFrame(() => {
              scrollViewRef.current?.scrollToEnd({ animated: false });
              hasInitiallyScrolledRef.current = true;
            });
          }
        }}
      >
        {messages.length === 0 ? (
          <View className="flex-1 items-center justify-center py-12">
            <Text className="text-gray-500 text-center">
              No messages yet. Start the conversation!
            </Text>
          </View>
        ) : (
          messages.map((message, index) => {
            const isSentByMe = message.sender_profile_id === user?.id;
            const senderName = isSentByMe
              ? "You"
              : message.sender?.full_name || "Unknown sender";
            const messageTime = message.sent_at || message.created_at;
            const showTimestamp =
              index === 0 ||
              new Date(messageTime).getTime() -
                new Date(
                  messages[index - 1].sent_at || messages[index - 1].created_at
                ).getTime() >
                300000; // 5 minutes

            // Show sender name only if it's the first message or if the sender changed from the previous message
            const previousMessage = index > 0 ? messages[index - 1] : null;
            const previousSenderId = previousMessage?.sender_profile_id;
            const showSenderName =
              index === 0 || previousSenderId !== message.sender_profile_id;

            return (
              <View key={message.id} className="mb-3">
                {showTimestamp && (
                  <Text className="text-xs text-gray-500 text-center mb-2">
                    {formatMessageTime(messageTime)}
                  </Text>
                )}
                {showSenderName && (
                  <View
                    className={`text-xs text-gray-500 mb-1 flex-row ${
                      isSentByMe ? "justify-end" : "justify-start"
                    }`}
                  >
                    <Text className="text-xs text-gray-500 mb-1">
                      {senderName}
                    </Text>
                  </View>
                )}

                <View
                  className={`flex-row ${
                    isSentByMe ? "justify-end" : "justify-start"
                  }`}
                >
                  <View
                    className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                      isSentByMe ? "" : "bg-white border border-gray-200"
                    }`}
                    style={
                      isSentByMe ? { backgroundColor: "#0086c9" } : undefined
                    }
                  >
                    <Text
                      className={`text-base ${
                        isSentByMe ? "text-white" : "text-gray-900"
                      }`}
                    >
                      {message.body}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Message Input */}
      <View
        className="border-t border-gray-200 px-4 py-3"
        style={{ paddingBottom: tabBarHeight + 12 }}
      >
        <View className="flex-row items-center">
          <TextInput
            className="flex-1 bg-white rounded-full px-4 py-4 text-gray-900 mr-2"
            placeholder="Type a message..."
            placeholderTextColor="#9ca3af"
            value={messageText}
            onChangeText={setMessageText}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            className={`w-10 h-10 rounded-full items-center justify-center ${
              messageText.trim() ? "" : "bg-gray-300"
            }`}
            style={
              messageText.trim() ? { backgroundColor: "#0086c9" } : undefined
            }
            onPress={handleSend}
            disabled={!messageText.trim()}
          >
            <View className="items-center justify-center w-full h-full">
              <SendIcon
                size={20}
                color="white"
                style={{ transform: [{ rotate: "45deg" }], marginLeft: -3 }}
              />
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
