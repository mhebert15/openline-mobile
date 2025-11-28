import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Pressable,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { format } from "date-fns";
import {
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  UserIcon,
  UtensilsIcon,
} from "lucide-react-native";
import { useDataCache } from "@/lib/contexts/DataCacheContext";
import { useAuth } from "@/lib/contexts/AuthContext";
import { supabase } from "@/lib/supabase/client";
import type {
  Meeting,
  Practitioner,
  PreferredMeetingTimes,
  FoodPreferences,
  LocationHours,
  User,
} from "@/lib/types/database.types";
import { mockMeetings, mockOffices } from "@/lib/mock/data";

export default function MeetingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { cache, prefetchTabData, invalidateTab } = useDataCache();
  const { user } = useAuth();

  const [practitioners, setPractitioners] = useState<Practitioner[]>([]);
  const [preferredMeetingTimes, setPreferredMeetingTimes] =
    useState<PreferredMeetingTimes | null>(null);
  const [foodPreferences, setFoodPreferences] =
    useState<FoodPreferences | null>(null);
  const [locationHours, setLocationHours] = useState<LocationHours[]>([]);
  const [officeStaff, setOfficeStaff] = useState<User[]>([]);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [loadedLocationId, setLoadedLocationId] = useState<string | null>(null);
  const [canceling, setCanceling] = useState(false);
  // Map of provider_id to availability status (true = available, false = unavailable)
  const [practitionerAvailability, setPractitionerAvailability] = useState<
    Record<string, boolean>
  >({});

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

  const loadLocationData = React.useCallback(
    async (locationId: string, meetingDate?: string) => {
      if (!user) return;

      try {
        setLoadingLocation(true);

        // Fetch providers (practitioners)
        const { data: providersData } = await supabase
          .from("locations")
          .select(
            "id, providers(id, location_id, profile_id, first_name, last_name, credential, specialty, email, phone, status, created_at, updated_at)"
          )
          .eq("id", locationId)
          .single();

        const providersList = ((providersData as any)?.providers || []).filter(
          (p: any) => p.status === "active"
        );
        const practitionersList: Practitioner[] = (providersList as any[]).map(
          (p: any) => ({
            ...p,
            location_id: p.location_id || locationId,
            title: p.credential || "",
          })
        );
        setPractitioners(practitionersList);

        // Fetch practitioner availability if meeting date is provided
        if (meetingDate && practitionersList.length > 0) {
          // Determine the meeting's day of week
          // JavaScript getDay(): 0=Sunday, 1=Monday, 2=Tuesday, etc.
          // provider_availability_effective uses: 0=Sunday, 1=Monday, etc. (matching location_hours)
          const meetingDateObj = new Date(meetingDate);
          const dayOfWeek = meetingDateObj.getDay(); // 0 = Sunday, 1 = Monday, etc.

          // Fetch availability for all practitioners for this day
          const providerIds = practitionersList.map((p) => p.id);
          const { data: availabilityData, error: availabilityError } =
            await supabase
              .from("provider_availability_effective")
              .select("provider_id, is_in_office_effective")
              .eq("location_id", locationId)
              .eq("day_of_week", dayOfWeek)
              .in("provider_id", providerIds);

          if (availabilityError) {
            console.error(
              "Error fetching practitioner availability:",
              availabilityError
            );
          } else {
            // Create a map of provider_id to availability status
            const availabilityMap: Record<string, boolean> = {};
            (availabilityData || []).forEach((item: any) => {
              availabilityMap[item.provider_id] =
                item.is_in_office_effective === true;
            });
            // Set availability for all practitioners (default to false if not found)
            practitionersList.forEach((practitioner) => {
              if (!(practitioner.id in availabilityMap)) {
                availabilityMap[practitioner.id] = false; // Unavailable if no data
              }
            });
            setPractitionerAvailability(availabilityMap);
          }
        }

        // Fetch preferred meeting times
        const { data: timeSlotsData } = await supabase
          .from("locations")
          .select(
            "id, location_preferred_time_slots(day_of_week, start_time, end_time, is_active)"
          )
          .eq("id", locationId)
          .single();

        const timeSlotsList = (
          (timeSlotsData as any)?.location_preferred_time_slots || []
        ).filter((slot: any) => slot.is_active === true);

        const preferredTimes: PreferredMeetingTimes = {
          monday: [],
          tuesday: [],
          wednesday: [],
          thursday: [],
          friday: [],
        };

        const dayMap: Record<number, keyof PreferredMeetingTimes> = {
          1: "monday", // location_preferred_time_slots uses: 1=Monday, 2=Tuesday, etc.
          2: "tuesday",
          3: "wednesday",
          4: "thursday",
          5: "friday",
        };

        const sortedSlots = (timeSlotsList as any[]).sort((a, b) => {
          if (a.day_of_week !== b.day_of_week) {
            return a.day_of_week - b.day_of_week;
          }
          return a.start_time.localeCompare(b.start_time);
        });

        sortedSlots.forEach((slot: any) => {
          const day = dayMap[slot.day_of_week];
          if (day) {
            const timeStr = `${slot.start_time} - ${slot.end_time}`;
            preferredTimes[day].push(timeStr);
          }
        });

        if (Object.values(preferredTimes).some((times) => times.length > 0)) {
          setPreferredMeetingTimes(preferredTimes);
        }

        // Fetch food preferences
        const { data: foodPrefData } = await supabase
          .from("food_preferences")
          .select("id")
          .eq("location_id", locationId)
          .eq("scope", "location")
          .maybeSingle();

        if (foodPrefData && (foodPrefData as { id: string }).id) {
          const foodPrefId = (foodPrefData as { id: string }).id;

          const [
            dietaryRestrictionsResult,
            favoriteCategoriesResult,
            dislikedCategoriesResult,
          ] = await Promise.all([
            supabase
              .from("food_preferences_dietary_restrictions")
              .select(
                "dietary_restriction_id, dietary_restrictions!inner(key, label)"
              )
              .eq("food_preference_id", foodPrefId),
            supabase
              .from("food_preferences_favorite_categories")
              .select("food_category_id, food_categories!inner(key, label)")
              .eq("food_preference_id", foodPrefId),
            supabase
              .from("food_preferences_disliked_categories")
              .select("food_category_id, food_categories!inner(key, label)")
              .eq("food_preference_id", foodPrefId),
          ]);

          setFoodPreferences({
            dietary_restrictions: (dietaryRestrictionsResult.data || []).map(
              (dr: any) =>
                dr.dietary_restrictions?.label ||
                dr.dietary_restrictions?.key ||
                ""
            ),
            favorite_foods: (favoriteCategoriesResult.data || []).map(
              (fc: any) =>
                fc.food_categories?.label || fc.food_categories?.key || ""
            ),
            dislikes: (dislikedCategoriesResult.data || []).map(
              (dc: any) =>
                dc.food_categories?.label || dc.food_categories?.key || ""
            ),
          });
        }

        // Fetch location hours
        const { data: hoursData } = await supabase
          .from("location_hours")
          .select("id, day_of_week, open_time, close_time, is_closed")
          .eq("location_id", locationId)
          .order("day_of_week", { ascending: true });

        if (hoursData) {
          setLocationHours((hoursData as LocationHours[]) || []);
        }

        // Fetch office staff
        const { data: staffRoles } = await supabase
          .from("user_roles")
          .select(
            "role, profiles(id, full_name, email, phone, user_type, default_company_id, default_location_id, status, created_at, updated_at)"
          )
          .eq("location_id", locationId)
          .in("role", ["location_admin", "office_staff", "scheduler"])
          .eq("status", "active");

        if (staffRoles && staffRoles.length > 0) {
          const staff: User[] = staffRoles
            .filter((role: any) => role.profiles)
            .map((role: any) => role.profiles as User);
          setOfficeStaff(staff);
        }
      } catch (error) {
        console.error("Error loading location data:", error);
      } finally {
        setLoadingLocation(false);
      }
    },
    [user]
  );

  // Reset location data when meeting id changes
  useEffect(() => {
    if (id) {
      setLoadedLocationId(null);
      setPractitioners([]);
      setPreferredMeetingTimes(null);
      setFoodPreferences(null);
      setLocationHours([]);
      setOfficeStaff([]);
      setPractitionerAvailability({});
    }
  }, [id]);

  // Use useEffect to handle data fetching when id becomes available
  useEffect(() => {
    // Only proceed if we have a valid id from navigation params
    if (!id || typeof id !== "string") {
      return;
    }

    // Prefetch calendar data if meeting not found in cache
    if (!meeting && id) {
      prefetchTabData("calendar").catch((error) =>
        console.error("Error prefetching meeting details:", error)
      );
    }

    // Load location data when meeting and user are available
    // Only load if we haven't already loaded data for this location
    if (
      meeting?.location_id &&
      user &&
      meeting.location_id !== loadedLocationId
    ) {
      setLoadedLocationId(meeting.location_id);
      loadLocationData(meeting.location_id, meeting.start_at);
    }
  }, [id, meeting, user, prefetchTabData, loadLocationData, loadedLocationId]);

  const handleCancelMeeting = async () => {
    if (!meeting?.id) {
      Alert.alert("Error", "Meeting ID not found.");
      return;
    }

    try {
      setCanceling(true);

      // Update the meeting status to "cancelled" instead of deleting
      // This respects RLS policies which allow the requester to update their meetings
      const statusUpdate = { status: "cancelled" as const };
      const query = supabase
        .from("meetings")
        .update(statusUpdate as unknown as never)
        .eq("id", meeting.id)
        .select();

      const { data, error } = (await query) as {
        data: Meeting[] | null;
        error: any;
      };

      if (error) {
        console.error("Error canceling meeting:", error);
        Alert.alert(
          "Error",
          `Failed to cancel meeting: ${
            error.message || "Unknown error"
          }. Please try again.`
        );
        setCanceling(false);
        return;
      }

      // Verify the meeting was updated
      if (!data || data.length === 0) {
        console.error("Meeting cancellation returned no data");
        Alert.alert(
          "Error",
          "Failed to cancel meeting. You may not have permission to cancel this meeting."
        );
        setCanceling(false);
        return;
      }

      const updatedMeeting = data[0] as Meeting;
      if (updatedMeeting.status !== "cancelled") {
        console.error("Meeting status was not updated to cancelled");
        Alert.alert("Error", "Failed to cancel meeting. Please try again.");
        setCanceling(false);
        return;
      }

      console.log("Meeting successfully cancelled:", meeting.id);

      // Invalidate cache to refresh data
      invalidateTab("dashboard");
      invalidateTab("calendar");

      // Prefetch updated data
      await prefetchTabData("dashboard");
      await prefetchTabData("calendar");

      // Navigate back to dashboard
      router.back();
    } catch (error) {
      console.error("Error canceling meeting:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      Alert.alert("Error", `Failed to cancel meeting: ${errorMessage}`);
    } finally {
      setCanceling(false);
    }
  };

  const showCancelConfirmation = () => {
    Alert.alert(
      "Cancel Meeting",
      "Are you sure you want to cancel this meeting? This action cannot be undone.",
      [
        {
          text: "No, Keep Meeting",
          style: "cancel",
        },
        {
          text: "Yes, Cancel Meeting",
          style: "destructive",
          onPress: handleCancelMeeting,
        },
      ]
    );
  };

  // Placeholder card component for loading states
  const PlaceholderCard = ({
    hasIcon = true,
    rowCount = 3,
    className = "bg-white rounded-xl p-4 shadow-sm mb-4 mx-4",
  }: {
    hasIcon?: boolean;
    rowCount?: number;
    className?: string;
  }) => (
    <View className={className}>
      <View className="flex-row items-center mb-3">
        {hasIcon && <View className="w-5 h-5 bg-gray-200 rounded mr-2" />}
        <View
          className="h-5 bg-gray-200 rounded flex-1"
          style={{ maxWidth: 200 }}
        />
      </View>
      {Array.from({ length: rowCount }).map((_, index) => (
        <View
          key={index}
          className={`py-2 ${
            index < rowCount - 1 ? "border-b border-gray-100" : ""
          }`}
        >
          <View
            className="h-4 bg-gray-200 rounded mb-1"
            style={{ width: "70%" }}
          />
          <View className="h-3 bg-gray-200 rounded" style={{ width: "50%" }} />
        </View>
      ))}
    </View>
  );

  if (!meeting) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#0086c9" />
      </View>
    );
  }

  const location = meeting.location;
  const meetingDate = new Date(meeting.start_at);
  const durationMinutes = meeting.end_at
    ? Math.round(
        (new Date(meeting.end_at).getTime() -
          new Date(meeting.start_at).getTime()) /
          60000
      )
    : null;

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View>
        <View className="bg-white p-4 shadow-sm">
          <View className="flex-row items-center mb-3">
            <View className="bg-blue-100 rounded-lg p-2 mr-3">
              <CalendarIcon size={20} color="#0086c9" />
            </View>
            <View className="flex-1">
              <Text className="text-lg font-semibold text-gray-900">
                {location?.name || meeting.title || "Medical Office"}
              </Text>
              <Text className="text-gray-500 text-sm capitalize">
                {meeting.status}
              </Text>
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
              {format(meetingDate, "h:mm a")}
              {meeting.end_at
                ? ` - ${format(new Date(meeting.end_at), "h:mm a")}`
                : ""}
              {durationMinutes ? ` • ${durationMinutes} minutes` : ""}
            </Text>
          </View>

          {location?.address_line1 && (
            <View className="flex-row items-start mb-2">
              <MapPinIcon size={18} color="#6b7280" />
              <Text className="text-gray-600 ml-2 flex-1">
                {location.address_line1}
                {location.city ? `, ${location.city}` : ""}
              </Text>
            </View>
          )}

          {meeting.description && (
            <View className="mt-3 pt-3 border-t border-gray-100">
              <Text className="text-gray-900 font-medium mb-1">
                Description
              </Text>
              <Text className="text-gray-600 text-sm">
                {meeting.description}
              </Text>
            </View>
          )}
        </View>
        {/* Location Information Cards */}
        {loadingLocation ? (
          <>
            {/* Practitioners Placeholder */}
            <PlaceholderCard
              hasIcon={true}
              rowCount={2}
              className="bg-white rounded-xl p-4 shadow-sm m-4"
            />

            {/* Location Hours Placeholder */}
            <PlaceholderCard
              hasIcon={true}
              rowCount={5}
              className="bg-white rounded-xl p-4 shadow-sm mb-4 mx-4"
            />

            {/* Preferred Meeting Times Placeholder */}
            <PlaceholderCard
              hasIcon={true}
              rowCount={3}
              className="bg-white rounded-xl p-4 mb-4 mx-4 shadow-sm"
            />

            {/* Food Preferences Placeholder */}
            <PlaceholderCard
              hasIcon={true}
              rowCount={4}
              className="bg-white rounded-xl p-4 mb-4 mx-4 shadow-sm"
            />

            {/* Office Staff Placeholder */}
            <PlaceholderCard
              hasIcon={false}
              rowCount={2}
              className="bg-white rounded-xl p-4 mb-4 mx-4 shadow-sm"
            />
          </>
        ) : (
          <>
            {/* Practitioners Section */}
            {practitioners.length > 0 && (
              <View className="bg-white rounded-xl p-4 shadow-sm m-4">
                <View className="flex-row items-center mb-3">
                  <UserIcon size={20} color="#0086c9" />
                  <Text className="text-lg font-semibold text-gray-900 ml-2">
                    Medical Practitioners
                  </Text>
                </View>
                {practitioners.map((practitioner, index) => {
                  const isAvailable =
                    practitionerAvailability[practitioner.id] === true;
                  return (
                    <View
                      key={practitioner.id}
                      className={`py-3 ${
                        index < practitioners.length - 1
                          ? "border-b border-gray-100"
                          : ""
                      }`}
                    >
                      <View className="flex-row items-center justify-between">
                        <View className="flex-1">
                          <Text className="text-gray-900 font-medium">
                            {practitioner.first_name} {practitioner.last_name}
                            {practitioner.title
                              ? `, ${practitioner.title}`
                              : ""}
                          </Text>
                          {practitioner.specialty && (
                            <Text className="text-gray-600 text-sm mt-1">
                              {practitioner.specialty}
                            </Text>
                          )}
                        </View>
                        <View
                          className={`px-2.5 py-1 rounded-full ${
                            isAvailable ? "bg-green-100" : "bg-gray-100"
                          }`}
                        >
                          <Text
                            className={`text-xs font-medium ${
                              isAvailable ? "text-green-700" : "text-gray-600"
                            }`}
                          >
                            {isAvailable ? "Available" : "Unavailable"}
                          </Text>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

            {/* Location Hours */}
            {locationHours.length > 0 && (
              <View className="bg-white rounded-xl p-4 shadow-sm mb-4 mx-4">
                <View className="flex-row items-center mb-3">
                  <ClockIcon size={20} color="#0086c9" />
                  <Text className="text-lg font-semibold text-gray-900 ml-2">
                    Location Hours
                  </Text>
                </View>
                {locationHours.map((hour) => {
                  const dayNames = [
                    "Sunday",
                    "Monday",
                    "Tuesday",
                    "Wednesday",
                    "Thursday",
                    "Friday",
                    "Saturday",
                  ];
                  const formatTime = (time: string | null): string => {
                    if (!time) return "";
                    const [hours, minutes] = time.split(":");
                    const hour = parseInt(hours, 10);
                    const ampm = hour >= 12 ? "PM" : "AM";
                    const displayHour = hour % 12 || 12;
                    return `${displayHour}:${minutes} ${ampm}`;
                  };
                  return (
                    <View
                      key={hour.id}
                      className="flex-row justify-between items-center py-2 border-b border-gray-100 last:border-b-0"
                    >
                      <Text className="text-gray-900 font-medium">
                        {dayNames[hour.day_of_week]}
                      </Text>
                      {hour.is_closed ? (
                        <Text className="text-gray-500 text-sm">Closed</Text>
                      ) : (
                        <Text className="text-gray-600 text-sm">
                          {formatTime(hour.open_time)} -{" "}
                          {formatTime(hour.close_time)}
                        </Text>
                      )}
                    </View>
                  );
                })}
              </View>
            )}

            {/* Preferred Meeting Times */}
            {preferredMeetingTimes && (
              <View className="bg-white rounded-xl p-4 mb-4 mx-4 shadow-sm">
                <View className="flex-row items-center mb-3">
                  <CalendarIcon size={20} color="#0086c9" />
                  <Text className="text-lg font-semibold text-gray-900 ml-2">
                    Preferred Meeting Times
                  </Text>
                </View>
                {[
                  { key: "monday", label: "Monday" },
                  { key: "tuesday", label: "Tuesday" },
                  { key: "wednesday", label: "Wednesday" },
                  { key: "thursday", label: "Thursday" },
                  { key: "friday", label: "Friday" },
                ].map((day) => {
                  const times =
                    preferredMeetingTimes[
                      day.key as keyof PreferredMeetingTimes
                    ];
                  if (!times || times.length === 0) return null;

                  const formatTimeRange = (timeRange: string): string => {
                    const [startTime, endTime] = timeRange.split(" - ");
                    if (!startTime || !endTime) return timeRange;

                    const formatTime = (time: string): string => {
                      const [hours, minutes] = time.split(":");
                      const hour = parseInt(hours, 10);
                      const ampm = hour >= 12 ? "PM" : "AM";
                      const displayHour = hour % 12 || 12;
                      return `${displayHour}:${minutes} ${ampm}`;
                    };

                    return `${formatTime(startTime)} - ${formatTime(endTime)}`;
                  };

                  return (
                    <View key={day.key} className="py-2">
                      <Text className="text-gray-900 font-medium">
                        {day.label}
                      </Text>
                      {times.map((time, idx) => (
                        <Text key={idx} className="text-gray-600 text-sm mt-1">
                          {formatTimeRange(time)}
                        </Text>
                      ))}
                    </View>
                  );
                })}
              </View>
            )}

            {/* Food Preferences */}
            {foodPreferences && (
              <View className="bg-white rounded-xl p-4 mb-4 mx-4 shadow-sm">
                <View className="flex-row items-center mb-3">
                  <UtensilsIcon size={20} color="#0086c9" />
                  <Text className="text-lg font-semibold text-gray-900 ml-2">
                    Food Preferences
                  </Text>
                </View>

                {foodPreferences.dietary_restrictions.length > 0 && (
                  <View className="mb-3">
                    <Text className="text-gray-900 font-medium mb-1">
                      Dietary Restrictions
                    </Text>
                    {foodPreferences.dietary_restrictions.map(
                      (restriction, idx) => (
                        <Text key={idx} className="text-gray-600 text-sm ml-2">
                          • {restriction}
                        </Text>
                      )
                    )}
                  </View>
                )}

                {foodPreferences.favorite_foods.length > 0 && (
                  <View>
                    <Text className="text-gray-900 font-medium mb-3">
                      Favorite Foods
                    </Text>
                    <View className="flex-row flex-wrap gap-2">
                      {foodPreferences.favorite_foods.map((food, idx) => (
                        <View
                          key={idx}
                          className="bg-green-100 rounded-full px-3 py-1"
                        >
                          <Text className="text-green-800 text-sm">{food}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {foodPreferences.dislikes.length > 0 && (
                  <View>
                    <Text className="text-gray-900 font-medium mb-3">
                      Dislikes
                    </Text>
                    <View className="flex-row flex-wrap gap-2">
                      {foodPreferences.dislikes.map((dislike, idx) => (
                        <View
                          key={idx}
                          className="bg-red-100 rounded-full px-3 py-1"
                        >
                          <Text className="text-red-800 text-sm">
                            {dislike}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </View>
            )}

            {/* Office Staff */}
            {officeStaff.length > 0 && (
              <View className="bg-white rounded-xl p-4 mb-4 mx-4 shadow-sm">
                <View className="flex-row items-center mb-3">
                  <UserIcon size={20} color="#0086c9" />
                  <Text className="text-lg font-semibold text-gray-900 ml-2">
                    Office Staff
                  </Text>
                </View>
                {officeStaff.map((staff, index) => (
                  <View
                    key={staff.id}
                    className={`py-2 ${
                      index < officeStaff.length - 1
                        ? "border-b border-gray-100"
                        : ""
                    }`}
                  >
                    <Text className="text-gray-900 font-medium">
                      {staff.full_name}
                    </Text>
                    <Text className="text-gray-600 text-sm">{staff.email}</Text>
                  </View>
                ))}
              </View>
            )}
          </>
        )}

        {/* Cancel Meeting Button */}
        <View className="p-4 pb-8">
          <Pressable
            onPress={showCancelConfirmation}
            className="bg-red-500 rounded-lg py-4 px-6 items-center"
            disabled={canceling}
          >
            {canceling ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text className="text-white font-semibold text-base">
                Cancel meeting
              </Text>
            )}
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}
