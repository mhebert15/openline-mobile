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
import { mockMessages } from "@/lib/mock/data";
import { mockMessagesService } from "@/lib/mock/services";
import { useAuth } from "@/lib/contexts/AuthContext";
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
  }, [locationId, user]);

  const loadConversation = () => {
    if (!user || !locationId) return;

    // Filter messages for this specific conversation
    const conversationMessages = mockMessages.filter(
      (msg) =>
        msg.location_id === locationId &&
        (msg.sender_profile_id === user.id ||
          msg.recipient_profile_id === user.id)
    );

    // Sort by sent_at/created_at ascending (oldest first)
    const sorted = conversationMessages.sort(
      (a, b) =>
        new Date(a.sent_at || a.created_at).getTime() -
        new Date(b.sent_at || b.created_at).getTime()
    );

    setMessages(sorted);
    setLoading(false);

    // Scroll to bottom after messages load
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: false });
    }, 100);
  };

  const handleSend = async () => {
    const trimmed = messageText.trim();

    if (!trimmed || !user || !locationId || !participantId) {
      return;
    }

    setSending(true);
    try {
      await mockMessagesService.sendMessage(participantId, locationId, trimmed);

      setMessageText("");
      loadConversation();

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

            return (
              <View key={message.id} className="mb-3">
                {showTimestamp && (
                  <Text className="text-xs text-gray-500 text-center mb-2">
                    {formatMessageTime(messageTime)}
                  </Text>
                )}
                <View
                  className={`text-xs text-gray-500 mb-1 flex-row ${
                    isSentByMe ? "justify-end" : "justify-start"
                  }`}
                >
                  <Text className="text-xs text-gray-500 mb-1">
                    {senderName}
                  </Text>
                </View>

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
              <SendIcon
                size={20}
                color="white"
                style={{ transform: [{ rotate: "45deg" }] }}
              />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
