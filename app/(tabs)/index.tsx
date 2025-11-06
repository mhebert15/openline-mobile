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

  // Get data from cache
  const upcomingMeetings =
    (cache.dashboard.upcomingMeetings.data as Meeting[]) || [];
  const completedCount = cache.dashboard.completedCount.data || 0;

  // Only show loader if cache is empty AND currently loading
  const loading =
    isLoading("dashboard") &&
    upcomingMeetings.length === 0 &&
    completedCount === 0;

  // Background refresh if cache is stale or empty
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
        paddingTop: insets.top, // Safe area top
      }}
    >
      <View className="p-6">
        {/* Welcome Section */}
        <View className="mb-6">
          <Text className="text-3xl font-bold text-gray-900 mb-1">
            Welcome back,
          </Text>
          <Text className="text-3xl font-bold" style={{ color: "#0086c9" }}>
            {user?.full_name || "User"}
          </Text>
        </View>

        {/* Stats Cards */}
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

        {/* Book Meeting Button */}
        <TouchableOpacity
          className="rounded-xl p-4 mb-6"
          style={{ backgroundColor: "#0086c9" }}
          onPress={() => router.push("/(tabs)/calendar")}
        >
          <Text className="text-white text-center font-semibold text-lg">
            Book New Meeting
          </Text>
        </TouchableOpacity>

        {/* Upcoming Meetings */}
        <View>
          <Text className="text-xl font-bold text-gray-900 mb-4">
            Upcoming Meetings
          </Text>

          {upcomingMeetings.length === 0 ? (
            <View className="bg-white rounded-xl p-8 items-center">
              <CalendarIcon size={48} color="#9ca3af" />
              <Text className="text-gray-500 mt-4 text-center">
                No upcoming meetings scheduled
              </Text>
              <TouchableOpacity
                className="mt-4"
                onPress={() => router.push("/(tabs)/calendar")}
              >
                <Text className="font-semibold" style={{ color: "#0086c9" }}>
                  Book your first meeting
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            upcomingMeetings.map((meeting) => (
              <View
                key={meeting.id}
                className="bg-white rounded-xl p-4 mb-3 shadow-sm"
              >
                <View className="flex-row items-center mb-2">
                  <View className="bg-blue-100 rounded-lg p-2 mr-3">
                    <CalendarIcon size={20} color="#0086c9" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-lg font-semibold text-gray-900">
                      {meeting.office?.name}
                    </Text>
                  </View>
                </View>

                <View className="flex-row items-center mb-2 ml-11">
                  <ClockIcon size={16} color="#6b7280" />
                  <Text className="text-gray-600 ml-2">
                    {format(
                      new Date(meeting.scheduled_at),
                      "EEEE, MMMM d, yyyy"
                    )}
                  </Text>
                </View>

                <View className="flex-row items-center mb-2 ml-11">
                  <ClockIcon size={16} color="#6b7280" />
                  <Text className="text-gray-600 ml-2">
                    {format(new Date(meeting.scheduled_at), "h:mm a")} •{" "}
                    {meeting.duration_minutes} minutes
                  </Text>
                </View>

                {meeting.office?.address && (
                  <View className="flex-row items-center ml-11">
                    <MapPinIcon size={16} color="#6b7280" />
                    <Text className="text-gray-500 ml-2 flex-1">
                      {meeting.office.address}, {meeting.office.city}
                    </Text>
                  </View>
                )}

                {meeting.notes && (
                  <View className="mt-3 pt-3 border-t border-gray-100 ml-11">
                    <Text className="text-gray-600 text-sm">
                      {meeting.notes}
                    </Text>
                  </View>
                )}
              </View>
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
