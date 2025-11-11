import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Calendar } from "react-native-calendars";
import type { MedicalOffice, Meeting } from "@/lib/types/database.types";
import { CalendarIcon, ClockIcon, MapPinIcon } from "lucide-react-native";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useDataCache } from "@/lib/contexts/DataCacheContext";
import { AnimatedTabScreen } from "@/components/AnimatedTabScreen";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

function CalendarScreen() {
  const { user } = useAuth();
  const { cache, prefetchTabData, isLoading } = useDataCache();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  // Get data from cache
  const meetings = (cache.calendar.meetings.data as Meeting[]) || [];
  const locations = (cache.calendar.locations.data as MedicalOffice[]) || [];

  // Only show loader if cache is empty AND currently loading
  const loading =
    isLoading("calendar") && meetings.length === 0 && locations.length === 0;

  // Background refresh if cache is stale or empty
  useEffect(() => {
    if (
      user &&
      (!cache.calendar.meetings.data || !cache.calendar.locations.data)
    ) {
      prefetchTabData("calendar").catch((error) => {
        console.error("Error loading calendar data:", error);
      });
    }
  }, [
    user,
    cache.calendar.meetings.data,
    cache.calendar.locations.data,
    prefetchTabData,
  ]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await prefetchTabData("calendar");
    } catch (error) {
      console.error("Error refreshing calendar data:", error);
    } finally {
      setRefreshing(false);
    }
  };

  const getMarkedDates = () => {
    const marked: Record<string, any> = {};

    meetings.forEach((meeting) => {
      const dateStr = meeting.scheduled_at.split("T")[0];
      marked[dateStr] = {
        marked: true,
        dotColor: "#0086c9",
      };
    });

    if (selectedDate) {
      marked[selectedDate] = {
        ...marked[selectedDate],
        selected: true,
        selectedColor: "#0086c9",
      };
    }

    return marked;
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
        contentContainerStyle={{ paddingTop: insets.top || 0 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View className="p-4">
          <View className="bg-white rounded-xl p-4 mb-4 shadow-sm">
            <Calendar
              onDayPress={(day) => setSelectedDate(day.dateString)}
              markedDates={getMarkedDates()}
              minDate={new Date().toISOString().split("T")[0]}
              theme={{
                todayTextColor: "#0086c9",
                arrowColor: "#0086c9",
              }}
            />
          </View>

          {/* Upcoming Meetings */}
          <View className="mb-4">
            <Text className="text-lg font-semibold text-gray-900 mb-3">
              Upcoming Meetings
            </Text>
            {meetings.length > 0 ? (
              meetings.map((meeting) => {
                const location = locations.find(
                  (loc) => loc.id === meeting.office_id
                );
                return (
                  <View
                    key={meeting.id}
                    className="bg-white rounded-xl p-4 mb-3 shadow-sm"
                  >
                    <View className="flex-row items-start justify-between mb-2">
                      <Text className="text-lg font-semibold text-gray-900 flex-1">
                        {location?.name || "Medical Office"}
                      </Text>
                    </View>
                    <View className="flex-row items-center mb-1">
                      <CalendarIcon size={16} color="#6b7280" />
                      <Text className="text-gray-600 ml-2">
                        {new Date(meeting.scheduled_at).toLocaleDateString(
                          undefined,
                          {
                            month: "long",
                            day: "numeric",
                            year: "numeric",
                          }
                        )}
                      </Text>
                    </View>
                    <View className="flex-row items-center mb-1">
                      <ClockIcon size={16} color="#6b7280" />
                      <Text className="text-gray-600 ml-2">
                        {new Date(meeting.scheduled_at).toLocaleTimeString(
                          undefined,
                          {
                            hour: "numeric",
                            minute: "2-digit",
                          }
                        )}
                      </Text>
                    </View>
                    {location && (
                      <View className="flex-row items-center">
                        <MapPinIcon size={16} color="#6b7280" />
                        <Text className="text-gray-600 ml-2">
                          {location.city}, {location.state}
                        </Text>
                      </View>
                    )}
                  </View>
                );
              })
            ) : (
              <View className="bg-white rounded-xl p-6 items-center">
                <Text className="text-gray-500 text-center">
                  No upcoming meetings scheduled
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Book New Meeting Button */}
      <View className="p-4 bg-white border-t border-gray-200">
        <TouchableOpacity
          className="rounded-xl p-4 flex-row items-center justify-center"
          style={{ backgroundColor: "#0086c9" }}
          onPress={() => router.push("/book-meeting")}
        >
          <Text className="text-white font-semibold text-lg">
            Book New Meeting
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function CalendarScreenWrapper() {
  return (
    <AnimatedTabScreen>
      <CalendarScreen />
    </AnimatedTabScreen>
  );
}
