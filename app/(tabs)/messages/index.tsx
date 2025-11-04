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
import { mockMessagesService } from "@/lib/mock/services";
import type { Message } from "@/lib/types/database.types";
import { format } from "date-fns";
import { MessageCircleIcon, PlusIcon } from "lucide-react-native";

export default function MessagesScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadMessages = async () => {
    if (!user) return;

    try {
      const data = await mockMessagesService.getMessages(user.id);
      // Sort by created_at descending (newest first)
      const sorted = data.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setMessages(sorted);
    } catch (error) {
      console.error("Error loading messages:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadMessages();
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    loadMessages();
  };

  const handleMessagePress = async (message: Message) => {
    // Mark as read if recipient
    if (message.recipient_id === user?.id && !message.read) {
      await mockMessagesService.markAsRead(message.id);
      loadMessages();
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
