import React, { useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { AnimatedTabScreen } from "@/components/AnimatedTabScreen";
import { useNotifications } from "@/lib/contexts/NotificationContext";
import { useRouter } from "expo-router";
import { useTabBarHeight } from "@/hooks/useTabBarHeight";
import { format, isToday, isYesterday, parseISO } from "date-fns";
import { Notification, NotificationMetadata } from "@/lib/types/database.types";

function NotificationsScreen() {
  const {
    notifications,
    loading,
    markAsRead,
    refreshNotifications,
    loadMore,
    hasMore,
  } = useNotifications();
  const router = useRouter();
  const tabBarHeight = useTabBarHeight();

  const handleNotificationPress = useCallback(
    async (notification: Notification) => {
      // Mark as read if unread
      if (!notification.read_at) {
        try {
          await markAsRead(notification.id);
        } catch (error) {
          console.error("Error marking notification as read:", error);
        }
      }

      // Navigate based on notification type and metadata
      const metadata = notification.metadata as NotificationMetadata | null;

      if (metadata) {
        if (metadata.meeting_id) {
          router.push(
            `/(tabs)/(dashboard)/meeting-detail?id=${metadata.meeting_id}`
          );
        } else if (metadata.location_id) {
          router.push(
            `/(tabs)/locations/location-detail?id=${metadata.location_id}`
          );
        }
      }
    },
    [markAsRead, router]
  );

  const formatNotificationDate = (dateString: string): string => {
    const date = parseISO(dateString);
    if (isToday(date)) {
      return format(date, "h:mm a");
    } else if (isYesterday(date)) {
      return "Yesterday";
    } else {
      return format(date, "MMM d, yyyy");
    }
  };

  const groupNotificationsByDate = (
    notifications: Notification[]
  ): { date: string; notifications: Notification[] }[] => {
    const groups: Record<string, Notification[]> = {};

    notifications.forEach((notification) => {
      const date = parseISO(notification.created_at);
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
      groups[groupKey].push(notification);
    });

    return Object.entries(groups).map(([date, notifications]) => ({
      date,
      notifications,
    }));
  };

  const groupedNotifications = groupNotificationsByDate(notifications);

  return (
    <ScrollView
      className="flex-1 bg-gray-50"
      refreshControl={
        <RefreshControl
          refreshing={loading && notifications.length === 0}
          onRefresh={refreshNotifications}
        />
      }
      contentContainerStyle={{
        paddingBottom: tabBarHeight + 16, // Tab bar height + extra padding
      }}
      onScroll={(event) => {
        const { layoutMeasurement, contentOffset, contentSize } =
          event.nativeEvent;
        const paddingToBottom = 20;
        if (
          layoutMeasurement.height + contentOffset.y >=
          contentSize.height - paddingToBottom
        ) {
          if (hasMore && !loading) {
            loadMore();
          }
        }
      }}
      scrollEventThrottle={400}
    >
      {loading && notifications.length === 0 ? (
        <View className="flex-1 items-center justify-center py-12">
          <ActivityIndicator size="large" color="#0086c9" />
        </View>
      ) : notifications.length === 0 ? (
        <View className="p-6">
          <Text className="text-2xl font-bold text-gray-900 mb-2">
            Notifications
          </Text>
          <Text className="text-gray-600">
            You're all caught up! We'll let you know when there's something new
            to review.
          </Text>
        </View>
      ) : (
        <View className="p-4">
          {groupedNotifications.map((group) => (
            <View key={group.date} className="mb-6">
              <Text className="text-sm font-semibold text-gray-500 mb-3 px-2">
                {group.date}
              </Text>
              {group.notifications.map((notification) => {
                const isUnread = !notification.read_at;
                return (
                  <TouchableOpacity
                    key={notification.id}
                    onPress={() => handleNotificationPress(notification)}
                    className={`bg-white rounded-lg p-4 mb-2 border ${
                      isUnread ? "border-blue-200" : "border-gray-200"
                    }`}
                    activeOpacity={0.7}
                  >
                    <View className="flex-row items-start">
                      {isUnread && (
                        <View className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3" />
                      )}
                      <View className="flex-1">
                        <View className="flex-row items-start justify-between mb-1">
                          <Text
                            className={`text-base font-semibold ${
                              isUnread ? "text-gray-900" : "text-gray-700"
                            }`}
                            style={{ flex: 1 }}
                          >
                            {notification.title}
                          </Text>
                        </View>
                        <Text
                          className={`text-sm ${
                            isUnread ? "text-gray-700" : "text-gray-600"
                          }`}
                        >
                          {notification.body}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
          {loading && notifications.length > 0 && (
            <View className="py-4">
              <ActivityIndicator size="small" color="#0086c9" />
            </View>
          )}
        </View>
      )}
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
