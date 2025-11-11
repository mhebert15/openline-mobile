import React, { useEffect, useMemo } from "react";
import { View, Text, ScrollView, ActivityIndicator } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { format } from "date-fns";
import {
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  UserIcon,
  UtensilsIcon,
} from "lucide-react-native";
import { useDataCache } from "@/lib/contexts/DataCacheContext";
import type { Meeting } from "@/lib/types/database.types";
import { mockMeetings, mockOffices } from "@/lib/mock/data";

export default function MeetingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { cache, prefetchTabData } = useDataCache();

  const meetingsFromCache = useMemo(() => {
    const dashboardMeetings =
      (cache.dashboard.upcomingMeetings.data as Meeting[]) || [];
    const calendarMeetings = (cache.calendar.meetings.data as Meeting[]) || [];
    return [...dashboardMeetings, ...calendarMeetings];
  }, [cache.dashboard.upcomingMeetings.data, cache.calendar.meetings.data]);

  const meeting: Meeting | undefined = useMemo(() => {
    if (!id) return undefined;
    const fromCache = meetingsFromCache.find((item) => item.id === id);
    if (fromCache) {
      return fromCache;
    }
    return mockMeetings.find((item) => item.id === id);
  }, [id, meetingsFromCache]);

  useEffect(() => {
    if (!meeting && id) {
      prefetchTabData("calendar").catch((error) =>
        console.error("Error prefetching meeting details:", error)
      );
    }
  }, [meeting, id, prefetchTabData]);

  if (!id) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <Text className="text-gray-600">Meeting not found</Text>
      </View>
    );
  }

  if (!meeting) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#0086c9" />
      </View>
    );
  }

  const office =
    meeting.office || mockOffices.find((o) => o.id === meeting.office_id);
  const meetingDate = new Date(meeting.scheduled_at);

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="p-6">
        <View className="bg-white rounded-xl p-4 mb-4 shadow-sm">
          <View className="flex-row items-center mb-3">
            <View className="bg-blue-100 rounded-lg p-2 mr-3">
              <CalendarIcon size={20} color="#0086c9" />
            </View>
            <View className="flex-1">
              <Text className="text-lg font-semibold text-gray-900">
                {office?.name || "Medical Office"}
              </Text>
              <Text className="text-gray-500 text-sm">{meeting.status}</Text>
            </View>
          </View>

          <View className="flex-row items-center mb-2">
            <ClockIcon size={18} color="#6b7280" />
            <Text className="text-gray-700 ml-2">
              {format(meetingDate, "EEEE, MMMM d, yyyy")}
            </Text>
          </View>

          <View className="flex-row items-center mb-2">
            <ClockIcon size={18} color="#6b7280" />
            <Text className="text-gray-700 ml-2">
              {format(meetingDate, "h:mm a")} • {meeting.duration_minutes}{" "}
              minutes
            </Text>
          </View>

          {office?.address && (
            <View className="flex-row items-start mb-2">
              <MapPinIcon size={18} color="#6b7280" />
              <Text className="text-gray-600 ml-2 flex-1">
                {office.address}
                {office.city ? `, ${office.city}` : ""}
              </Text>
            </View>
          )}

          {meeting.notes && (
            <View className="mt-3 pt-3 border-t border-gray-100">
              <Text className="text-gray-900 font-medium mb-1">Notes</Text>
              <Text className="text-gray-600 text-sm">{meeting.notes}</Text>
            </View>
          )}
        </View>

        {office?.practitioners && office.practitioners.length > 0 && (
          <View className="bg-white rounded-xl p-4 mb-4 shadow-sm">
            <View className="flex-row items-center mb-3">
              <UserIcon size={20} color="#0086c9" />
              <Text className="text-lg font-semibold text-gray-900 ml-2">
                Practitioners
              </Text>
            </View>
            {office.practitioners.map((practitioner) => (
              <View key={practitioner.id} className="mb-2">
                <Text className="text-gray-900 font-medium">
                  {practitioner.name}
                </Text>
                <Text className="text-gray-500 text-sm">
                  {practitioner.title} • {practitioner.specialty}
                </Text>
              </View>
            ))}
          </View>
        )}

        {office?.food_preferences && (
          <View className="bg-white rounded-xl p-4 mb-6 shadow-sm">
            <View className="flex-row items-center mb-3">
              <UtensilsIcon size={20} color="#0086c9" />
              <Text className="text-lg font-semibold text-gray-900 ml-2">
                Food Preferences
              </Text>
            </View>

            {office.food_preferences.dietary_restrictions.length > 0 && (
              <View className="mb-3">
                <Text className="text-gray-900 font-medium mb-1">
                  Dietary Restrictions
                </Text>
                {office.food_preferences.dietary_restrictions.map(
                  (restriction, index) => (
                    <Text key={index} className="text-gray-600 text-sm ml-2">
                      • {restriction}
                    </Text>
                  )
                )}
              </View>
            )}

            {office.food_preferences.favorite_foods.length > 0 && (
              <View className="mb-3">
                <Text className="text-gray-900 font-medium mb-1">
                  Favorite Foods
                </Text>
                <View className="flex-row flex-wrap">
                  {office.food_preferences.favorite_foods.map((food, index) => (
                    <View
                      key={index}
                      className="bg-green-100 rounded-full px-3 py-1 mr-2 mb-2"
                    >
                      <Text className="text-green-800 text-sm">{food}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {office.food_preferences.dislikes.length > 0 && (
              <View>
                <Text className="text-gray-900 font-medium mb-1">Dislikes</Text>
                <View className="flex-row flex-wrap">
                  {office.food_preferences.dislikes.map((item, index) => (
                    <View
                      key={index}
                      className="bg-red-100 rounded-full px-3 py-1 mr-2 mb-2"
                    >
                      <Text className="text-red-800 text-sm">{item}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        )}
      </View>
    </ScrollView>
  );
}
