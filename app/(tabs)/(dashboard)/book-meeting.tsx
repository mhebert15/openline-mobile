import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { addDays, format, parse } from "date-fns";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CalendarIcon, ClockIcon, CheckIcon } from "lucide-react-native";

import { useAuth } from "@/lib/contexts/AuthContext";
import { useDataCache } from "@/lib/contexts/DataCacheContext";
import { MedicalOffice, Meeting, TimeSlot } from "@/lib/types/database.types";
import { mockOfficesService, mockMeetingsService } from "@/lib/mock/services";

export default function BookMeetingScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const { cache, prefetchTabData, isLoading } = useDataCache();

  const meetings = (cache.calendar.meetings.data as Meeting[]) || [];
  const locations = (cache.calendar.locations.data as MedicalOffice[]) || [];

  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(
    null
  );
  const [selectedDateIndex, setSelectedDateIndex] = useState(0);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    if (
      user &&
      (!cache.calendar.meetings.data || !cache.calendar.locations.data)
    ) {
      prefetchTabData("calendar").catch((error) =>
        console.error("Error loading calendar data:", error)
      );
    }
  }, [
    user,
    cache.calendar.meetings.data,
    cache.calendar.locations.data,
    prefetchTabData,
  ]);

  useEffect(() => {
    if (locations.length > 0 && !selectedLocationId) {
      setSelectedLocationId(locations[0].id);
    }
  }, [locations, selectedLocationId]);

  const dateOptions = useMemo(() => {
    const today = new Date();
    return Array.from({ length: 30 }).map((_, index) => {
      const date = addDays(today, index);
      return {
        key: format(date, "yyyy-MM-dd"),
        dayLabel: format(date, "EEE"),
        dayNumber: format(date, "d"),
        monthLabel: format(date, "MMM"),
      };
    });
  }, []);

  const selectedDate = dateOptions[selectedDateIndex]?.key ?? "";

  const selectedLocation = useMemo(() => {
    if (!selectedLocationId) return null;
    return (
      locations.find((location) => location.id === selectedLocationId) || null
    );
  }, [locations, selectedLocationId]);

  const userTimeZone = useMemo(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch (error) {
      return "Local Time";
    }
  }, []);

  useEffect(() => {
    if (selectedLocation && selectedDate) {
      loadAvailableSlots();
    }
  }, [selectedLocation, selectedDate]);

  const loadAvailableSlots = async () => {
    if (!selectedLocation || !selectedDate) return;

    try {
      setSlotsLoading(true);
      const slots = await mockOfficesService.getAvailableSlots(
        selectedLocation.id,
        selectedDate
      );
      setAvailableSlots(slots);
    } catch (error) {
      console.error("Error loading slots:", error);
      setAvailableSlots([]);
    } finally {
      setSlotsLoading(false);
    }
  };

  const formatTimeLabel = (time: string) => {
    const parsed = parse(time, "HH:mm", new Date());
    return format(parsed, "h:mm a");
  };

  const dayMeetings = useMemo(() => {
    if (!selectedDate) return [] as Meeting[];
    return meetings.filter((meeting) => {
      const matchesDate = meeting.scheduled_at.startsWith(selectedDate);
      const matchesLocation = selectedLocationId
        ? meeting.office_id === selectedLocationId
        : true;
      return matchesDate && matchesLocation;
    });
  }, [meetings, selectedDate, selectedLocationId]);

  const dayMeetingTimes = useMemo(() => {
    return dayMeetings.map((meeting) =>
      format(new Date(meeting.scheduled_at), "HH:mm")
    );
  }, [dayMeetings]);

  const preferredSlots = availableSlots.filter((slot) => slot.preferred);
  const otherSlots = availableSlots.filter((slot) => !slot.preferred);

  const handleBookMeeting = async () => {
    if (!selectedLocation || !selectedDate || !selectedTime) {
      Alert.alert(
        "Select Meeting Details",
        "Choose a location, date, and time to continue."
      );
      return;
    }

    setBooking(true);
    try {
      const scheduledAt = new Date(
        `${selectedDate}T${selectedTime}:00`
      ).toISOString();
      await mockMeetingsService.createMeeting(
        selectedLocation.id,
        scheduledAt,
        "Meeting booked via mobile app"
      );

      Alert.alert(
        "Meeting Scheduled",
        `Your meeting at ${selectedLocation.name} is booked for ${format(
          new Date(selectedDate),
          "MMMM d, yyyy"
        )} at ${formatTimeLabel(selectedTime)}.`,
        [
          {
            text: "OK",
            onPress: async () => {
              setSelectedTime(null);
              setSelectedDateIndex(0);
              setSelectedLocationId(locations[0]?.id ?? null);
              await prefetchTabData("calendar");
              await prefetchTabData("dashboard");
              router.back();
            },
          },
        ]
      );
    } catch (error) {
      console.error("Error booking meeting:", error);
      Alert.alert("Error", "Unable to schedule the meeting. Please try again.");
    } finally {
      setBooking(false);
    }
  };

  if (isLoading("calendar") && locations.length === 0) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#0086c9" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50 pt-6">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 140, paddingHorizontal: 20 }}
      >
        <View className="mb-6">
          <Text className="text-base font-semibold text-gray-800 mb-3">
            Choose a Location
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {locations.map((location) => {
              const isSelected = selectedLocationId === location.id;
              return (
                <TouchableOpacity
                  key={location.id}
                  activeOpacity={0.85}
                  onPress={() => {
                    setSelectedLocationId(location.id);
                    setSelectedDateIndex(0);
                    setSelectedTime(null);
                  }}
                  className={`mr-3 mb-2 bg-white rounded-2xl px-5 py-4 shadow-sm border ${
                    isSelected ? "border-[#0086c9]" : "border-transparent"
                  }`}
                  style={{ paddingLeft: 42 }}
                >
                  {!isSelected && (
                    <View
                      style={{
                        position: "absolute",
                        top: 24,
                        left: 12,
                        borderWidth: 1,
                        borderColor: "#cccccc",
                        borderRadius: 999,
                        padding: 4,
                        width: 20,
                        height: 20,
                      }}
                    />
                  )}
                  {isSelected && (
                    <View
                      style={{
                        position: "absolute",
                        top: 24,
                        left: 12,
                        backgroundColor: "#0086c9",
                        borderRadius: 999,
                        padding: 4,
                      }}
                    >
                      <CheckIcon size={12} color="white" />
                    </View>
                  )}
                  <Text className="text-base font-semibold text-gray-900">
                    {location.name}
                  </Text>
                  <Text className="text-sm text-gray-500 mt-1">
                    {location.address}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Date selector */}
        <View className="mb-6">
          <View className="flex-row items-baseline justify-between mb-3">
            <Text className="text-base font-semibold text-gray-800">
              Pick a Date
            </Text>
            <Text className="text-xs uppercase text-gray-500">
              Timezone: {userTimeZone}
            </Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {dateOptions.map((dateOption, index) => {
              const isSelected = selectedDateIndex === index;
              const hasMeetings = meetings.some((meeting) => {
                const matchesLocation = selectedLocationId
                  ? meeting.office_id === selectedLocationId
                  : true;
                return (
                  matchesLocation &&
                  meeting.scheduled_at.startsWith(dateOption.key)
                );
              });
              return (
                <TouchableOpacity
                  key={dateOption.key}
                  activeOpacity={0.85}
                  onPress={() => {
                    setSelectedDateIndex(index);
                    setSelectedTime(null);
                  }}
                  className={`mr-3 mb-2 bg-white items-center rounded-2xl px-4 py-3 border shadow-sm ${
                    isSelected ? "border-[#0086c9]" : "bg-white border-gray-200"
                  }`}
                  style={{ minWidth: 88 }}
                >
                  <Text className="text-xs font-semibold uppercase text-gray-500">
                    {dateOption.dayLabel}
                  </Text>
                  {hasMeetings && (
                    <View
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: 999,
                        backgroundColor: "#0086c9",
                        marginTop: 4,
                      }}
                    />
                  )}
                  <Text className="text-base font-semibold mt-2 text-gray-900">
                    {dateOption.dayNumber}
                  </Text>
                  <Text className="text-xs mt-1 text-gray-500">
                    {dateOption.monthLabel}
                  </Text>
                  {!isSelected && (
                    <View
                      style={{
                        borderWidth: 1,
                        borderColor: "#cccccc",
                        borderRadius: 999,
                        padding: 4,
                        width: 20,
                        height: 20,
                        marginTop: 8,
                      }}
                    />
                  )}
                  {isSelected && (
                    <View
                      style={{
                        backgroundColor: "#0086c9",
                        borderRadius: 999,
                        padding: 4,
                        marginTop: 8,
                      }}
                    >
                      <CheckIcon size={12} color="white" />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Existing meetings for this date */}
        {dayMeetings.length > 0 && (
          <View className="mb-6 bg-white rounded-2xl p-4 shadow-sm">
            <Text className="text-base font-semibold text-gray-900 mb-3">
              Already Scheduled
            </Text>
            {dayMeetings.map((meeting) => {
              const location = locations.find(
                (loc) => loc.id === meeting.office_id
              );
              return (
                <View key={meeting.id} className="mb-3 last:mb-0">
                  <Text className="text-sm font-semibold text-gray-900">
                    {meeting.office?.name || location?.name || "Meeting"}
                  </Text>
                  <View className="flex-row items-center mt-1">
                    <ClockIcon size={14} color="#6b7280" />
                    <Text className="text-xs text-gray-600 ml-2">
                      {format(new Date(meeting.scheduled_at), "h:mm a")}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Preferred slots */}
        <View className="mb-6">
          <Text className="text-base font-semibold text-gray-800 mb-3">
            Preferred Times
          </Text>
          {!selectedLocation ? (
            <Text className="text-gray-500 text-sm">
              Select a location to view preferred times.
            </Text>
          ) : slotsLoading ? (
            <ActivityIndicator color="#0086c9" />
          ) : preferredSlots.length > 0 ? (
            preferredSlots.map((slot) => {
              if (dayMeetingTimes.includes(slot.time)) {
                return null;
              }
              const isSelected = selectedTime === slot.time;
              const disabled = !slot.available;
              const clinicianCount = slot.clinicianCount ?? 1;
              return (
                <TouchableOpacity
                  key={slot.time}
                  activeOpacity={0.8}
                  disabled={disabled}
                  onPress={() => setSelectedTime(slot.time)}
                  className={`mb-2 rounded-2xl bg-white px-4 py-3 flex-row items-center justify-between border shadow-sm ${
                    isSelected
                      ? "border-[#0086c9]"
                      : disabled
                      ? "bg-gray-100 border-gray-100"
                      : "bg-white border-gray-200"
                  }`}
                >
                  <View>
                    <Text
                      className={`text-base font-semibold ${
                        disabled ? "text-gray-400" : "text-gray-900"
                      }`}
                    >
                      {formatTimeLabel(slot.time)}
                    </Text>
                    <Text
                      className={`text-xs mt-1 ${
                        disabled ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      {clinicianCount} clinician
                      {clinicianCount === 1 ? "" : "s"} available
                    </Text>
                  </View>
                  <ClockIcon
                    size={18}
                    color={disabled ? "#9ca3af" : "#0086c9"}
                  />
                </TouchableOpacity>
              );
            })
          ) : (
            <Text className="text-gray-500 text-sm">
              No preferred times available for this location.
            </Text>
          )}
        </View>

        {/* Other slots */}
        <View className="mb-8">
          <Text className="text-base font-semibold text-gray-800 mb-3">
            All Other Times
          </Text>
          {!selectedLocation ? (
            <Text className="text-gray-500 text-sm">
              Choose a location to see all available times.
            </Text>
          ) : slotsLoading ? (
            <ActivityIndicator color="#0086c9" />
          ) : otherSlots.length > 0 ? (
            otherSlots.map((slot) => {
              if (dayMeetingTimes.includes(slot.time)) {
                return null;
              }
              const isSelected = selectedTime === slot.time;
              const disabled = !slot.available;
              const clinicianCount = slot.clinicianCount ?? 1;
              return (
                <TouchableOpacity
                  key={slot.time}
                  activeOpacity={0.8}
                  disabled={disabled}
                  onPress={() => setSelectedTime(slot.time)}
                  className={`mb-2 rounded-2xl bg-white px-4 py-3 flex-row items-center justify-between border shadow-sm ${
                    isSelected
                      ? "border-[#0086c9]"
                      : disabled
                      ? "bg-gray-100 border-gray-100"
                      : "bg-white border-gray-200"
                  }`}
                >
                  <View>
                    <Text
                      className={`text-base font-semibold ${
                        disabled ? "text-gray-400" : "text-gray-900"
                      }`}
                    >
                      {formatTimeLabel(slot.time)}
                    </Text>
                    <Text
                      className={`text-xs mt-1 ${
                        disabled ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      {clinicianCount} clinician
                      {clinicianCount === 1 ? "" : "s"} available
                    </Text>
                  </View>
                  <ClockIcon
                    size={18}
                    color={disabled ? "#9ca3af" : "#94a3b8"}
                  />
                </TouchableOpacity>
              );
            })
          ) : (
            <Text className="text-gray-500 text-sm">
              No other times available for this location.
            </Text>
          )}
        </View>

        {meetings.length > 0 && (
          <View className="bg-white rounded-2xl p-4 shadow-sm">
            <Text className="text-base font-semibold text-gray-900 mb-3">
              Upcoming Meetings
            </Text>
            {meetings.slice(0, 3).map((meeting) => {
              const location = locations.find(
                (loc) => loc.id === meeting.office_id
              );
              return (
                <View key={meeting.id} className="mb-3 last:mb-0">
                  <Text className="text-sm font-semibold text-gray-900">
                    {location?.name || "Medical Office"}
                  </Text>
                  <View className="flex-row items-center mt-1">
                    <CalendarIcon size={14} color="#6b7280" />
                    <Text className="text-xs text-gray-600 ml-2">
                      {format(new Date(meeting.scheduled_at), "MMMM d, yyyy")}
                    </Text>
                  </View>
                  <View className="flex-row items-center mt-1">
                    <ClockIcon size={14} color="#6b7280" />
                    <Text className="text-xs text-gray-600 ml-2">
                      {format(new Date(meeting.scheduled_at), "h:mm a")}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      <View className="absolute left-0 right-0 bottom-0 bg-white border-t border-gray-200 p-5">
        <TouchableOpacity
          disabled={
            !selectedLocation || !selectedDate || !selectedTime || booking
          }
          onPress={handleBookMeeting}
          activeOpacity={0.85}
          className="rounded-xl py-4 items-center"
          style={{
            backgroundColor:
              !selectedLocation || !selectedDate || !selectedTime || booking
                ? "#9ca3af"
                : "#0086c9",
          }}
        >
          {booking ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-semibold text-lg">Continue</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
