import React, {
  useState,
  useCallback,
  useLayoutEffect,
  useEffect,
} from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter, useNavigation } from "expo-router";
import { supabase } from "@/lib/supabase/client";
import type {
  MedicalOffice,
  Practitioner,
  PreferredMeetingTimes,
  FoodPreferences,
  User,
  LocationHours,
} from "@/lib/types/database.types";
import {
  MapPinIcon,
  PhoneIcon,
  UserIcon,
  CalendarIcon,
  UtensilsIcon,
  MessageSquareIcon,
  ClockIcon,
} from "lucide-react-native";
import { useAuth } from "@/lib/contexts/AuthContext";

export default function LocationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const navigation = useNavigation();
  const { user } = useAuth();
  const [location, setLocation] = useState<MedicalOffice | null>(null);
  const [officeStaff, setOfficeStaff] = useState<User[]>([]);
  const [locationHours, setLocationHours] = useState<LocationHours[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id || !user) return;
    loadLocationData();
  }, [id, user]);

  const loadLocationData = async () => {
    if (!id || !user) return;

    try {
      setLoading(true);
      setError(null);

      // First, verify user has access to this location
      const isAdmin = user.user_type === "admin";
      let hasAccess = isAdmin;

      if (!isAdmin) {
        // Check if user has access through medical_rep_locations
        const { data: medicalRep } = await supabase
          .from("medical_reps")
          .select("id")
          .eq("profile_id", user.id)
          .eq("status", "active")
          .maybeSingle();

        if (medicalRep && (medicalRep as { id: string }).id) {
          const { data: repLocation } = await supabase
            .from("medical_rep_locations")
            .select("location_id")
            .eq("medical_rep_id", (medicalRep as { id: string }).id)
            .eq("location_id", id)
            .eq("relationship_status", "active")
            .maybeSingle();

          hasAccess = !!repLocation;
        }
      }

      if (!hasAccess) {
        setError("You don't have access to this location");
        setLoading(false);
        return;
      }

      // Fetch location data
      const { data: locationData, error: locationError } = await supabase
        .from("locations")
        .select(
          "id, name, address_line1, address_line2, city, state, postal_code, phone, status, created_at"
        )
        .eq("id", id)
        .eq("status", "active")
        .is("deleted_at", null)
        .single();

      if (locationError || !locationData) {
        setError("Location not found");
        setLoading(false);
        return;
      }

      const loc = locationData as {
        id: string;
        name: string;
        address_line1: string | null;
        address_line2: string | null;
        city: string | null;
        state: string | null;
        postal_code: string | null;
        phone: string | null;
        status: string;
        created_at: string;
      };

      // Fetch providers (practitioners)
      // Query through locations join to avoid RLS recursion on providers table
      // The providers RLS policy uses is_location_participant which causes recursion
      const { data: providersData, error: providersError } = await supabase
        .from("locations")
        .select(
          "id, providers(id, location_id, profile_id, first_name, last_name, credential, specialty, email, phone, image_url, status, created_at, updated_at)"
        )
        .eq("id", id)
        .single();

      if (providersError) {
        console.error("Error fetching providers:", providersError);
      }

      // Extract providers from the nested structure and filter by status
      const providersList = ((providersData as any)?.providers || []).filter(
        (p: any) => p.status === "active"
      );
      const practitioners: Practitioner[] = (providersList as any[]).map(
        (p: any) => ({
          ...p,
          location_id: p.location_id || id, // location_id might not be in nested query
          title: p.credential || "", // Add the derived title field
        })
      );

      // Fetch preferred meeting times
      // Query through locations join to avoid RLS recursion on location_preferred_time_slots table
      // The time slots RLS policy uses is_location_participant which causes recursion
      const { data: timeSlotsData, error: timeSlotsError } = await supabase
        .from("locations")
        .select(
          "id, location_preferred_time_slots(day_of_week, start_time, end_time, is_active)"
        )
        .eq("id", id)
        .single();

      if (timeSlotsError) {
        console.error("Error fetching time slots:", timeSlotsError);
      }

      // Extract time slots from the nested structure and filter by is_active
      const timeSlotsList = (
        (timeSlotsData as any)?.location_preferred_time_slots || []
      ).filter((slot: any) => slot.is_active === true);

      const preferredMeetingTimes: PreferredMeetingTimes = {
        monday: [],
        tuesday: [],
        wednesday: [],
        thursday: [],
        friday: [],
      };

      const dayMap: Record<number, keyof PreferredMeetingTimes> = {
        0: "monday",
        1: "tuesday",
        2: "wednesday",
        3: "thursday",
        4: "friday",
      };

      // Sort by day_of_week, then by start_time
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
          preferredMeetingTimes[day].push(timeStr);
        }
      });

      console.log("Fetched time slots:", timeSlotsList?.length || 0);
      console.log("Preferred meeting times:", preferredMeetingTimes);

      // Fetch food preferences
      const { data: foodPrefData } = await supabase
        .from("food_preferences")
        .select("id")
        .eq("location_id", id)
        .eq("scope", "location")
        .maybeSingle();

      let foodPreferences: FoodPreferences | undefined;

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

        foodPreferences = {
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
        };
      }

      // Fetch location hours
      const { data: hoursData, error: hoursError } = await supabase
        .from("location_hours")
        .select("id, day_of_week, open_time, close_time, is_closed")
        .eq("location_id", id)
        .order("day_of_week", { ascending: true });

      if (hoursError) {
        console.error("Error fetching location hours:", hoursError);
      } else {
        setLocationHours((hoursData as LocationHours[]) || []);
        console.log("Fetched location hours:", hoursData?.length || 0);
      }

      // Fetch all office staff (location_admin, office_staff, scheduler)
      const { data: staffRoles, error: staffRolesError } = await supabase
        .from("user_roles")
        .select(
          "role, profiles(id, full_name, email, phone, user_type, default_company_id, default_location_id, status, created_at, updated_at)"
        )
        .eq("location_id", id)
        .in("role", ["location_admin", "office_staff", "scheduler"])
        .eq("status", "active");

      if (staffRolesError) {
        console.error("Error fetching office staff:", staffRolesError);
      }

      if (staffRoles && staffRoles.length > 0) {
        const staff: User[] = staffRoles
          .filter((role: any) => role.profiles)
          .map((role: any) => role.profiles as User);
        setOfficeStaff(staff);
        console.log("Fetched office staff:", staff.length);
      } else {
        setOfficeStaff([]);
        console.log("No office staff found for location");
      }

      // Build the location object
      const locationObj: MedicalOffice = {
        id: loc.id,
        name: loc.name,
        address: loc.address_line1 || "",
        city: loc.city || "",
        state: loc.state || "",
        zip_code: loc.postal_code || "",
        phone: loc.phone || "",
        latitude: 0,
        longitude: 0,
        created_at: loc.created_at,
        practitioners: practitioners.length > 0 ? practitioners : undefined,
        preferred_meeting_times: Object.values(preferredMeetingTimes).some(
          (times) => times.length > 0
        )
          ? preferredMeetingTimes
          : undefined,
        food_preferences: foodPreferences,
        admin_user_id:
          officeStaff.find((s) => s.user_type === "admin")?.id ||
          officeStaff[0]?.id,
      };

      console.log("Final location object:", {
        hasPractitioners: !!locationObj.practitioners,
        practitionersCount: locationObj.practitioners?.length || 0,
        hasPreferredTimes: !!locationObj.preferred_meeting_times,
        hasFoodPreferences: !!locationObj.food_preferences,
        hasAdminUserId: !!locationObj.admin_user_id,
      });

      setLocation(locationObj);
    } catch (err) {
      console.error("Error loading location data:", err);
      setError("Failed to load location data");
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = useCallback(async () => {
    if (!location || !user) return;

    // Use the first office staff member (prefer admin if available)
    const primaryContact =
      officeStaff.find((s) => s.user_type === "admin") || officeStaff[0];

    if (primaryContact) {
      // Check for existing message thread with primary contact
      const { data: existingMessage } = await supabase
        .from("messages")
        .select("id, location_id, sender_profile_id, recipient_profile_id")
        .or(
          `and(sender_profile_id.eq.${user.id},recipient_profile_id.eq.${primaryContact.id}),and(sender_profile_id.eq.${primaryContact.id},recipient_profile_id.eq.${user.id})`
        )
        .eq("location_id", location.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existingMessage) {
        router.push({
          pathname: "/(tabs)/messages/message-detail",
          params: {
            officeId: location.id,
            officeName: location.name,
            participantIds: primaryContact.id,
            participantNames: primaryContact.full_name,
            primaryParticipantId: primaryContact.id,
            fromLocation: "true",
            locationId: location.id,
          },
        });
        return;
      }

      router.push({
        pathname: "/compose-message",
        params: {
          officeId: location.id,
          officeName: location.name,
          participantId: primaryContact.id,
          participantName: primaryContact.full_name,
          fromLocation: "true",
          locationId: location.id,
        },
      });
    } else {
      Alert.alert("Error", "No office staff contact available");
    }
  }, [officeStaff, location, router, user]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={handleSendMessage}
          className="mr-2"
          style={{ paddingHorizontal: 12, paddingVertical: 6 }}
        >
          <MessageSquareIcon size={20} color="#0086c9" />
        </TouchableOpacity>
      ),
    });
  }, [navigation, handleSendMessage]);

  const handleBookMeeting = () => {
    router.push("/(tabs)/calendar");
  };

  const daysOfWeek = [
    { key: "monday", label: "Monday" },
    { key: "tuesday", label: "Tuesday" },
    { key: "wednesday", label: "Wednesday" },
    { key: "thursday", label: "Thursday" },
    { key: "friday", label: "Friday" },
  ];

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
    // Convert HH:MM:SS to HH:MM AM/PM format
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#0086c9" />
      </View>
    );
  }

  if (error || !location) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <Text className="text-gray-600">{error || "Location not found"}</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView className="flex-1">
        {/* Location Info Header */}
        <View className="bg-white px-6 py-4 border-b border-gray-200">
          <Text className="text-xl font-bold text-gray-900 mb-2">
            {location.name}
          </Text>
          <View className="flex-row items-center mb-2">
            <MapPinIcon size={16} color="#6b7280" />
            <Text className="text-gray-600 ml-2">
              {location.address}, {location.city}, {location.state}{" "}
              {location.zip_code}
            </Text>
          </View>
          <View className="flex-row items-center">
            <PhoneIcon size={16} color="#6b7280" />
            <Text className="text-gray-600 ml-2">{location.phone}</Text>
          </View>
        </View>

        <View className="px-4 py-4">
          {/* Practitioners Section */}
          {location.practitioners && location.practitioners.length > 0 && (
            <View className="bg-white rounded-xl p-4 mb-4 shadow-sm">
              <View className="flex-row items-center mb-3">
                <UserIcon size={20} color="#0086c9" />
                <Text className="text-lg font-semibold text-gray-900 ml-2">
                  Medical Practitioners
                </Text>
              </View>
              {location.practitioners.map((practitioner, index) => (
                <View
                  key={practitioner.id}
                  className={`py-3 ${
                    index < location.practitioners!.length - 1
                      ? "border-b border-gray-100"
                      : ""
                  }`}
                >
                  <Text className="text-gray-900 font-medium">
                    {practitioner.first_name} {practitioner.last_name}
                    {practitioner.title ? `, ${practitioner.title}` : ""}
                  </Text>
                  {practitioner.specialty && (
                    <Text className="text-gray-600 text-sm mt-1">
                      {practitioner.specialty}
                    </Text>
                  )}
                </View>
              ))}
            </View>
          )}

          {/* Location Hours */}
          {locationHours.length > 0 && (
            <View className="bg-white rounded-xl p-4 mb-4 shadow-sm">
              <View className="flex-row items-center mb-3">
                <ClockIcon size={20} color="#0086c9" />
                <Text className="text-lg font-semibold text-gray-900 ml-2">
                  Location Hours
                </Text>
              </View>
              {locationHours.map((hour) => (
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
              ))}
            </View>
          )}

          {/* Preferred Meeting Times */}
          {location.preferred_meeting_times && (
            <View className="bg-white rounded-xl p-4 mb-4 shadow-sm">
              <View className="flex-row items-center mb-3">
                <CalendarIcon size={20} color="#0086c9" />
                <Text className="text-lg font-semibold text-gray-900 ml-2">
                  Preferred Meeting Times
                </Text>
              </View>
              {daysOfWeek.map((day) => {
                const times =
                  location.preferred_meeting_times?.[
                    day.key as keyof typeof location.preferred_meeting_times
                  ];
                if (!times || times.length === 0) return null;
                return (
                  <View key={day.key} className="py-2">
                    <Text className="text-gray-900 font-medium">
                      {day.label}
                    </Text>
                    {times.map((time, idx) => (
                      <Text
                        key={idx}
                        className="text-gray-600 text-sm ml-2 mt-1"
                      >
                        • {time}
                      </Text>
                    ))}
                  </View>
                );
              })}
            </View>
          )}

          {/* Food Preferences */}
          {location.food_preferences && (
            <View className="bg-white rounded-xl p-4 mb-4 shadow-sm">
              <View className="flex-row items-center mb-3">
                <UtensilsIcon size={20} color="#0086c9" />
                <Text className="text-lg font-semibold text-gray-900 ml-2">
                  Food Preferences
                </Text>
              </View>

              {location.food_preferences.dietary_restrictions.length > 0 && (
                <View className="mb-3">
                  <Text className="text-gray-900 font-medium mb-1">
                    Dietary Restrictions
                  </Text>
                  {location.food_preferences.dietary_restrictions.map(
                    (restriction, idx) => (
                      <Text key={idx} className="text-gray-600 text-sm ml-2">
                        • {restriction}
                      </Text>
                    )
                  )}
                </View>
              )}

              {location.food_preferences.favorite_foods.length > 0 && (
                <View className="mb-3">
                  <Text className="text-gray-900 font-medium mb-1">
                    Favorite Foods
                  </Text>
                  <View className="flex-row flex-wrap">
                    {location.food_preferences.favorite_foods.map(
                      (food, idx) => (
                        <View
                          key={idx}
                          className="bg-green-100 rounded-full px-3 py-1 mr-2 mb-2"
                        >
                          <Text className="text-green-800 text-sm">{food}</Text>
                        </View>
                      )
                    )}
                  </View>
                </View>
              )}

              {location.food_preferences.dislikes.length > 0 && (
                <View>
                  <Text className="text-gray-900 font-medium mb-1">
                    Dislikes
                  </Text>
                  <View className="flex-row flex-wrap">
                    {location.food_preferences.dislikes.map((dislike, idx) => (
                      <View
                        key={idx}
                        className="bg-red-100 rounded-full px-3 py-1 mr-2 mb-2"
                      >
                        <Text className="text-red-800 text-sm">{dislike}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>
          )}

          {/* Office Staff */}
          {officeStaff.length > 0 && (
            <View className="bg-white rounded-xl p-4 mb-4 shadow-sm">
              <Text className="text-lg font-semibold text-gray-900 mb-3">
                Office Staff
              </Text>
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
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View className="bg-white border-t border-gray-200 px-4 py-4">
        <TouchableOpacity
          className="rounded-xl p-4 flex-row items-center justify-center mb-3"
          style={{ backgroundColor: "#0086c9" }}
          onPress={() => router.push("/(tabs)/(dashboard)/book-meeting")}
        >
          <CalendarIcon size={20} color="white" />
          <Text className="text-white font-semibold text-lg ml-2">
            Book a meeting
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
