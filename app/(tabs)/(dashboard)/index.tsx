import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useDataCache } from "@/lib/contexts/DataCacheContext";
import type { Meeting } from "@/lib/types/database.types";
import { format } from "date-fns";
import { CalendarIcon, MapPinIcon, ClockIcon } from "lucide-react-native";
import { AnimatedTabScreen } from "@/components/AnimatedTabScreen";

function DashboardScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { cache, prefetchTabData, invalidateTab, isLoading } = useDataCache();
  const [refreshing, setRefreshing] = useState(false);

  const upcomingMeetings =
    (cache.dashboard.upcomingMeetings.data as Meeting[]) || [];
  const completedCount = cache.dashboard.completedCount.data || 0;

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
      }}
    >
      <View className="p-4">
        <View className="mb-4">
          <Text className="text-3xl font-bold text-gray-900">
            Welcome back,
          </Text>
          <Text className="text-3xl font-bold" style={{ color: "#0086c9" }}>
            {user?.full_name || "User"}
          </Text>
        </View>

        <View className="flex-row mb-6 gap-4">
          <View className="flex-1 bg-white rounded-xl p-5 shadow-sm">
            <Text className="text-gray-600 text-sm mb-2">
              Completed Meetings
            </Text>
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
          className="rounded-xl p-4 mb-6"
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
            <Text className="text-xl font-bold text-gray-900 mb-4">
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
                    <Text className="text-lg font-semibold text-gray-900">
                      {meeting.location?.name || meeting.title || "Meeting"}
                    </Text>
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
          <Text className="text-xl font-bold text-gray-900 mb-4">
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
                    <Text className="text-lg font-semibold text-gray-900">
                      {meeting.location?.name || meeting.title || "Meeting"}
                    </Text>
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
