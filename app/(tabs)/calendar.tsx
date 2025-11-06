import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
} from "react-native";
import { Calendar } from "react-native-calendars";
import { mockOfficesService, mockMeetingsService } from "@/lib/mock/services";
import type {
  MedicalOffice,
  TimeSlot,
  Meeting,
} from "@/lib/types/database.types";
import {
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  PlusIcon,
  XIcon,
} from "lucide-react-native";
import { format } from "date-fns";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useDataCache } from "@/lib/contexts/DataCacheContext";
import { AnimatedTabScreen } from "@/components/AnimatedTabScreen";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function CalendarScreen() {
  const { user } = useAuth();
  const { cache, prefetchTabData, isLoading } = useDataCache();
  const insets = useSafeAreaInsets();
  const [selectedLocation, setSelectedLocation] =
    useState<MedicalOffice | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [booking, setBooking] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);

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

  useEffect(() => {
    if (selectedLocation && selectedDate) {
      loadAvailableSlots();
    }
  }, [selectedLocation, selectedDate]);

  const loadAvailableSlots = async () => {
    if (!selectedLocation || !selectedDate) return;

    try {
      const slots = await mockOfficesService.getAvailableSlots(
        selectedLocation.id,
        selectedDate
      );
      setAvailableSlots(slots);
    } catch (error) {
      console.error("Error loading slots:", error);
      setAvailableSlots([]);
    }
  };

  const handleBookMeeting = async () => {
    if (!selectedLocation || !selectedDate || !selectedTime) {
      Alert.alert("Error", "Please select a location, date, and time");
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
        "Success",
        `Meeting booked at ${selectedLocation.name} on ${format(
          new Date(selectedDate),
          "MMMM d, yyyy"
        )} at ${selectedTime}`,
        [
          {
            text: "OK",
            onPress: async () => {
              setSelectedLocation(null);
              setSelectedDate("");
              setSelectedTime(null);
              setShowBookingModal(false);
              // Refresh calendar data after booking
              await prefetchTabData("calendar");
              // Also refresh dashboard as it shows upcoming meetings
              await prefetchTabData("dashboard");
            },
          },
        ]
      );
    } catch (error) {
      console.error("Error booking meeting:", error);
      Alert.alert("Error", "Failed to book meeting. Please try again.");
    } finally {
      setBooking(false);
    }
  };

  const getMarkedDates = () => {
    const marked: any = {};

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
                        {format(new Date(meeting.scheduled_at), "MMMM d, yyyy")}
                      </Text>
                    </View>
                    <View className="flex-row items-center mb-1">
                      <ClockIcon size={16} color="#6b7280" />
                      <Text className="text-gray-600 ml-2">
                        {format(new Date(meeting.scheduled_at), "h:mm a")}
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
          onPress={() => setShowBookingModal(true)}
        >
          <PlusIcon size={20} color="white" />
          <Text className="text-white font-semibold text-lg ml-2">
            Book New Meeting
          </Text>
        </TouchableOpacity>
      </View>

      {/* Booking Modal */}
      <Modal
        visible={showBookingModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View className="flex-1 bg-gray-50">
          <View className="bg-white border-b border-gray-200 px-4 py-3 flex-row items-center justify-between">
            <Text className="text-lg font-semibold text-gray-900">
              Book New Meeting
            </Text>
            <TouchableOpacity onPress={() => setShowBookingModal(false)}>
              <XIcon size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <ScrollView className="flex-1">
            <View className="p-4">
              {/* Location Selection */}
              <Text className="text-lg font-semibold text-gray-900 mb-3">
                Select Location
              </Text>
              {locations.map((location) => (
                <TouchableOpacity
                  key={location.id}
                  className={`bg-white rounded-xl p-4 mb-3 shadow-sm ${
                    selectedLocation?.id === location.id ? "border-2" : ""
                  }`}
                  style={
                    selectedLocation?.id === location.id
                      ? { borderColor: "#0086c9" }
                      : undefined
                  }
                  onPress={() => setSelectedLocation(location)}
                >
                  <Text className="text-lg font-semibold text-gray-900 mb-1">
                    {location.name}
                  </Text>
                  <Text className="text-gray-600 text-sm">
                    {location.city}, {location.state}
                  </Text>
                </TouchableOpacity>
              ))}

              {selectedLocation && (
                <>
                  {/* Date Selection */}
                  <Text className="text-lg font-semibold text-gray-900 mb-3 mt-4">
                    Select Date
                  </Text>
                  <Calendar
                    onDayPress={(day) => {
                      setSelectedDate(day.dateString);
                      setSelectedTime(null);
                    }}
                    markedDates={{
                      [selectedDate]: {
                        selected: true,
                        selectedColor: "#0086c9",
                      },
                    }}
                    minDate={new Date().toISOString().split("T")[0]}
                    theme={{
                      todayTextColor: "#0086c9",
                      arrowColor: "#0086c9",
                    }}
                  />

                  {/* Time Slots */}
                  {selectedDate && (
                    <View className="mt-6">
                      <Text className="text-lg font-semibold text-gray-900 mb-3">
                        Available Time Slots
                      </Text>
                      {availableSlots.length > 0 ? (
                        <View className="flex-row flex-wrap gap-2">
                          {availableSlots.map((slot) => (
                            <TouchableOpacity
                              key={slot.time}
                              disabled={!slot.available}
                              className={`px-4 py-3 rounded-lg ${
                                selectedTime === slot.time
                                  ? ""
                                  : slot.available
                                  ? "bg-white border border-gray-300"
                                  : "bg-gray-100"
                              }`}
                              style={
                                selectedTime === slot.time
                                  ? { backgroundColor: "#0086c9" }
                                  : undefined
                              }
                              onPress={() => setSelectedTime(slot.time)}
                            >
                              <Text
                                className={`font-medium ${
                                  selectedTime === slot.time
                                    ? "text-white"
                                    : slot.available
                                    ? "text-gray-900"
                                    : "text-gray-400"
                                }`}
                              >
                                {slot.time}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      ) : (
                        <Text className="text-gray-500 text-center py-4">
                          No available slots for this date
                        </Text>
                      )}
                    </View>
                  )}

                  {/* Confirm Button */}
                  {selectedTime && (
                    <TouchableOpacity
                      className="rounded-xl p-4 mt-6 mb-8"
                      style={{ backgroundColor: "#0086c9" }}
                      onPress={handleBookMeeting}
                      disabled={booking}
                    >
                      {booking ? (
                        <ActivityIndicator color="white" />
                      ) : (
                        <Text className="text-white text-center font-semibold text-lg">
                          Confirm Booking
                        </Text>
                      )}
                    </TouchableOpacity>
                  )}
                </>
              )}
            </View>
          </ScrollView>
        </View>
      </Modal>
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
