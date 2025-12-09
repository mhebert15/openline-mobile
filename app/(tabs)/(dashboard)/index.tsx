import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useDataCache } from "@/lib/contexts/DataCacheContext";
import { useTabBarHeight } from "@/hooks/useTabBarHeight";
import type { Meeting } from "@/lib/types/database.types";
import { format } from "date-fns";
import { CalendarIcon, MapPinIcon, ClockIcon } from "lucide-react-native";
import { AnimatedTabScreen } from "@/components/AnimatedTabScreen";
import {
  useToast,
  Toast,
  ToastTitle,
  ToastDescription,
} from "@/components/ui/toast";

function DashboardScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useTabBarHeight();
  const { cache, prefetchTabData, invalidateTab, isLoading } = useDataCache();
  const [refreshing, setRefreshing] = useState(false);
  const toast = useToast();
  const params = useLocalSearchParams<{
    bookingSuccess?: string;
    locationName?: string;
    meetingDate?: string;
    meetingTime?: string;
  }>();

  const upcomingMeetings =
    (cache.dashboard.upcomingMeetings.data as Meeting[]) || [];
  const completedCount = cache.dashboard.completedCount.data || 0;

  // Show toast when booking success params are present
  useFocusEffect(
    React.useCallback(() => {
      if (params.bookingSuccess === "true") {
        const locationName = params.locationName || "the location";
        const meetingDate = params.meetingDate || "";
        const meetingTime = params.meetingTime || "";

        toast.show({
          placement: "top",
          render: ({ id }) => {
            return (
              <Toast nativeID={`toast-${id}`} action="success" variant="solid">
                <ToastTitle>Meeting Scheduled</ToastTitle>
                <ToastDescription>
                  Your meeting at {locationName} is booked for {meetingDate} at{" "}
                  {meetingTime}.
                </ToastDescription>
              </Toast>
            );
          },
        });

        // Clear params to prevent re-showing
        router.setParams({
          bookingSuccess: undefined,
          locationName: undefined,
          meetingDate: undefined,
          meetingTime: undefined,
        });
      }
    }, [
      params.bookingSuccess,
      params.locationName,
      params.meetingDate,
      params.meetingTime,
      toast,
      router,
    ])
  );

  // Helper function to get status badge styling
  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case "approved":
        return {
          bgColor: "#d1fae5",
          textColor: "#065f46",
          label: "Approved",
        };
      case "pending":
        return {
          bgColor: "#fef3c7",
          textColor: "#92400e",
          label: "Pending",
        };
      default:
        return {
          bgColor: "#e5e7eb",
          textColor: "#374151",
          label: status,
        };
    }
  };

  // Filter today's meetings
  const todaysMeetings = useMemo(() => {
    const today = new Date();
    const todayStr = format(today, "yyyy-MM-dd");
    return upcomingMeetings.filter((meeting) => {
      const meetingDate = format(new Date(meeting.start_at), "yyyy-MM-dd");
      return meetingDate === todayStr;
    });
  }, [upcomingMeetings]);

  // Filter upcoming meetings (excluding today)
  const futureMeetings = useMemo(() => {
    const today = new Date();
    const todayStr = format(today, "yyyy-MM-dd");
    return upcomingMeetings.filter((meeting) => {
      const meetingDate = format(new Date(meeting.start_at), "yyyy-MM-dd");
      return meetingDate !== todayStr;
    });
  }, [upcomingMeetings]);

  // Show loading only if data is being fetched AND we don't have data yet
  // Once we have data (even if empty), we should show the content
  const loading =
    isLoading("dashboard") &&
    (!cache.dashboard.upcomingMeetings.data ||
      cache.dashboard.completedCount.data === null ||
      cache.dashboard.completedCount.data === undefined);

  useEffect(() => {
    if (
      user &&
      (!cache.dashboard.upcomingMeetings.data ||
        !cache.dashboard.completedCount.data)
    ) {
      prefetchTabData("dashboard").catch((error) => {
        console.error("Error loading dashboard data:", error);
      });
    }
  }, [
    user,
    cache.dashboard.upcomingMeetings.data,
    cache.dashboard.completedCount.data,
    prefetchTabData,
  ]);

  const onRefresh = async () => {
    setRefreshing(true);
    invalidateTab("dashboard");
    try {
      await prefetchTabData("dashboard");
    } catch (error) {
      console.error("Error refreshing dashboard data:", error);
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#0086c9" />
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-gray-50"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      contentContainerStyle={{
        paddingTop: insets.top,
        paddingBottom: tabBarHeight + 16, // Tab bar height + extra padding
      }}
    >
      <View className="p-4">
        <View className="mb-6">
          <Text className="text-3xl font-bold text-gray-900">Welcome,</Text>
          <Text className="text-3xl font-bold" style={{ color: "#0086c9" }}>
            {user?.full_name || "User"}
          </Text>
        </View>

        <Text className="text-xl font-bold text-gray-900 mb-3">Meetings</Text>
        <View className="flex-row mb-6 gap-4">
          <View className="flex-1 bg-white rounded-xl p-5 shadow-sm">
            <Text className="text-gray-600 text-sm mb-2">Completed</Text>
            <Text className="text-3xl font-bold text-gray-900">
              {completedCount}
            </Text>
          </View>
          <View className="flex-1 bg-white rounded-xl p-5 shadow-sm">
            <Text className="text-gray-600 text-sm mb-2">Upcoming</Text>
            <Text className="text-3xl font-bold" style={{ color: "#0086c9" }}>
              {upcomingMeetings.length}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          className="rounded-xl p-4 mb-8"
          style={{ backgroundColor: "#0086c9" }}
          onPress={() => router.push("/book-meeting")}
        >
          <Text className="text-white text-center font-semibold text-lg">
            Book a meeting
          </Text>
        </TouchableOpacity>

        {/* Today's Meetings */}
        {todaysMeetings.length > 0 && (
          <View className="mb-6">
            <Text className="text-xl font-bold text-gray-900 mb-3">
              Today's Meetings
            </Text>
            {todaysMeetings.map((meeting) => (
              <TouchableOpacity
                key={meeting.id}
                className="bg-white rounded-xl p-4 mb-3 shadow-sm"
                activeOpacity={0.9}
                onPress={() => {
                  router.push({
                    pathname: "/(tabs)/(dashboard)/meeting-detail",
                    params: { id: meeting.id },
                  });
                }}
              >
                <View className="flex-row items-center mb-2">
                  <View className="bg-blue-100 rounded-lg p-2 mr-3">
                    <CalendarIcon size={20} color="#0086c9" />
                  </View>
                  <View className="flex-1">
                    <View className="flex-row items-center justify-between">
                      <Text className="text-lg font-semibold text-gray-900 flex-1">
                        {meeting.location?.name || meeting.title || "Meeting"}
                      </Text>
                      <View
                        className="px-3 py-1 rounded-full ml-2"
                        style={{
                          backgroundColor: getStatusBadgeStyle(meeting.status)
                            .bgColor,
                        }}
                      >
                        <Text
                          className="text-xs font-semibold"
                          style={{
                            color: getStatusBadgeStyle(meeting.status)
                              .textColor,
                          }}
                        >
                          {getStatusBadgeStyle(meeting.status).label}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>

                <View className="flex-row items-center mb-2 ml-11">
                  <ClockIcon size={16} color="#6b7280" />
                  <Text className="text-gray-600 ml-2">
                    {format(new Date(meeting.start_at), "EEEE, MMMM d, yyyy")}
                  </Text>
                </View>

                <View className="flex-row items-center mb-2 ml-11">
                  <ClockIcon size={16} color="#6b7280" />
                  <Text className="text-gray-600 ml-2">
                    {format(new Date(meeting.start_at), "h:mm a")}
                    {meeting.end_at
                      ? ` - ${format(new Date(meeting.end_at), "h:mm a")}`
                      : ""}
                    {meeting.end_at &&
                      ` • ${Math.round(
                        (new Date(meeting.end_at).getTime() -
                          new Date(meeting.start_at).getTime()) /
                          60000
                      )} minutes`}
                  </Text>
                </View>

                {meeting.location?.address_line1 && (
                  <View className="flex-row items-center ml-11">
                    <MapPinIcon size={16} color="#6b7280" />
                    <Text className="text-gray-500 ml-2 flex-1">
                      {meeting.location.address_line1}
                      {meeting.location.city
                        ? `, ${meeting.location.city}`
                        : ""}
                    </Text>
                  </View>
                )}

                {meeting.description && (
                  <View className="mt-3 pt-3 border-t border-gray-100 ml-11">
                    <Text className="text-gray-600 text-sm">
                      {meeting.description}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View>
          <Text className="text-xl font-bold text-gray-900 mb-3">
            Upcoming Meetings
          </Text>

          {futureMeetings.length === 0 ? (
            <View className="bg-white rounded-xl p-8 items-center">
              <CalendarIcon size={48} color="#9ca3af" />
              <Text className="text-gray-500 mt-4 text-center">
                No upcoming meetings scheduled
              </Text>
            </View>
          ) : (
            futureMeetings.map((meeting) => (
              <TouchableOpacity
                key={meeting.id}
                className="bg-white rounded-xl p-4 mb-3 shadow-sm"
                activeOpacity={0.9}
                onPress={() => {
                  router.push({
                    pathname: "/(tabs)/(dashboard)/meeting-detail",
                    params: { id: meeting.id },
                  });
                }}
              >
                <View className="flex-row items-center mb-2">
                  <View className="bg-blue-100 rounded-lg p-2 mr-3">
                    <CalendarIcon size={20} color="#0086c9" />
                  </View>
                  <View className="flex-1">
                    <View className="flex-row items-center justify-between">
                      <Text className="text-lg font-semibold text-gray-900 flex-1">
                        {meeting.location?.name || meeting.title || "Meeting"}
                      </Text>
                      <View
                        className="px-3 py-1 rounded-full ml-2"
                        style={{
                          backgroundColor: getStatusBadgeStyle(meeting.status)
                            .bgColor,
                        }}
                      >
                        <Text
                          className="text-xs font-semibold"
                          style={{
                            color: getStatusBadgeStyle(meeting.status)
                              .textColor,
                          }}
                        >
                          {getStatusBadgeStyle(meeting.status).label}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>

                <View className="flex-row items-center mb-2 ml-11">
                  <ClockIcon size={16} color="#6b7280" />
                  <Text className="text-gray-600 ml-2">
                    {format(new Date(meeting.start_at), "EEEE, MMMM d, yyyy")}
                  </Text>
                </View>

                <View className="flex-row items-center mb-2 ml-11">
                  <ClockIcon size={16} color="#6b7280" />
                  <Text className="text-gray-600 ml-2">
                    {format(new Date(meeting.start_at), "h:mm a")}
                    {meeting.end_at
                      ? ` - ${format(new Date(meeting.end_at), "h:mm a")}`
                      : ""}
                    {meeting.end_at &&
                      ` • ${Math.round(
                        (new Date(meeting.end_at).getTime() -
                          new Date(meeting.start_at).getTime()) /
                          60000
                      )} minutes`}
                  </Text>
                </View>

                {meeting.location?.address_line1 && (
                  <View className="flex-row items-center ml-11">
                    <MapPinIcon size={16} color="#6b7280" />
                    <Text className="text-gray-500 ml-2 flex-1">
                      {meeting.location.address_line1}
                      {meeting.location.city
                        ? `, ${meeting.location.city}`
                        : ""}
                    </Text>
                  </View>
                )}

                {meeting.description && (
                  <View className="mt-3 pt-3 border-t border-gray-100 ml-11">
                    <Text className="text-gray-600 text-sm">
                      {meeting.description}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            ))
          )}
        </View>
      </View>
    </ScrollView>
  );
}

export default function DashboardScreenWrapper() {
  return (
    <AnimatedTabScreen>
      <DashboardScreen />
    </AnimatedTabScreen>
  );
}
