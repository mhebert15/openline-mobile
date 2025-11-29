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
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAuth } from "@/lib/contexts/AuthContext";
import { supabase } from "@/lib/supabase/client";
import type { Message } from "@/lib/types/database.types";
import { format } from "date-fns";
import { SendIcon } from "lucide-react-native";

export default function MessageDetailScreen() {
  const { locationId, participantId } = useLocalSearchParams<{
    locationId: string;
    locationName?: string;
    participantId?: string;
    participantName?: string;
  }>();
  const { user } = useAuth();
  const scrollViewRef = useRef<ScrollView>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [messageText, setMessageText] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    loadConversation();
  }, [locationId, participantId, user]);

  const loadConversation = async () => {
    if (!user || !locationId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Fetch messages for this specific conversation thread
      // Filter by location_id and where user is either sender or recipient
      // Also filter by participantId to show only messages with that specific participant
      // We need messages where:
      //   - location_id matches
      //   - AND (user is sender AND participant is recipient) OR (user is recipient AND participant is sender)
      const { data: messagesData, error: messagesError } = await supabase
        .from("messages")
        .select(
          "id, location_id, meeting_id, sender_profile_id, recipient_profile_id, body, sent_at, read_at, created_at, updated_at, sender:profiles!messages_sender_profile_id_fkey(id, full_name, email, phone, user_type, status), recipient:profiles!messages_recipient_profile_id_fkey(id, full_name, email, phone, user_type, status)"
        )
        .eq("location_id", locationId)
        .or(
          `and(sender_profile_id.eq.${user.id},recipient_profile_id.eq.${participantId}),and(sender_profile_id.eq.${participantId},recipient_profile_id.eq.${user.id})`
        )
        .order("sent_at", { ascending: true });

      if (messagesError) {
        console.error("Error fetching messages:", messagesError);
        setMessages([]);
        setLoading(false);
        return;
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
        read_at: msg.read_at,
        created_at: msg.created_at,
        updated_at: msg.updated_at,
        sender: msg.sender ? (msg.sender as any) : undefined,
        recipient: msg.recipient ? (msg.recipient as any) : undefined,
      }));

      setMessages(messages);

      // Scroll to bottom after messages load
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: false });
      }, 100);
    } catch (error) {
      console.error("Error loading conversation:", error);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    const trimmed = messageText.trim();

    if (!trimmed || !user || !locationId || !participantId) {
      return;
    }

    setSending(true);
    try {
      // Insert new message into Supabase
      const { error: insertError } = await supabase.from("messages").insert({
        location_id: locationId,
        sender_profile_id: user.id,
        recipient_profile_id: participantId,
        body: trimmed,
        sent_at: new Date().toISOString(),
      } as any);

      if (insertError) {
        console.error("Error sending message:", insertError);
        return;
      }

      setMessageText("");
      await loadConversation();

      // Scroll to bottom after sending
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setSending(false);
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
        onContentSizeChange={() =>
          scrollViewRef.current?.scrollToEnd({ animated: true })
        }
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
      <View className="bg-white border-t border-gray-200 px-4 py-3">
        <View className="flex-row items-center">
          <TextInput
            className="flex-1 bg-gray-100 rounded-full px-4 py-4 text-gray-900 mr-2"
            placeholder="Type a message..."
            placeholderTextColor="#9ca3af"
            value={messageText}
            onChangeText={setMessageText}
            multiline
            maxLength={500}
            editable={!sending}
          />
          <TouchableOpacity
            className={`w-10 h-10 rounded-full items-center justify-center ${
              messageText.trim() && !sending ? "" : "bg-gray-300"
            }`}
            style={
              messageText.trim() && !sending
                ? { backgroundColor: "#0086c9" }
                : undefined
            }
            onPress={handleSend}
            disabled={!messageText.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <View className="items-center justify-center w-full h-full">
                <SendIcon
                  size={20}
                  color="white"
                  style={{ transform: [{ rotate: "45deg" }], marginLeft: -3 }}
                />
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
