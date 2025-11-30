import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Switch,
  Modal,
} from "react-native";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { addDays, format, parse } from "date-fns";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CalendarIcon, ClockIcon, CheckIcon } from "lucide-react-native";

import { useAuth } from "@/lib/contexts/AuthContext";
import { useDataCache } from "@/lib/contexts/DataCacheContext";
import { supabase } from "@/lib/supabase/client";
import {
  MedicalOffice,
  Meeting,
  TimeSlot,
  LocationHours,
} from "@/lib/types/database.types";

export default function BookMeetingScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const { cache, prefetchTabData, isLoading, invalidateTab } = useDataCache();

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
  const [locationHours, setLocationHours] = useState<LocationHours[]>([]);
  const [currentUserMedicalRepId, setCurrentUserMedicalRepId] = useState<
    string | null
  >(null);
  const [allDayMeetings, setAllDayMeetings] = useState<Meeting[]>([]);
  const [showProviders, setShowProviders] = useState(false);

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

  // Fetch current user's medical_rep_id
  useEffect(() => {
    const fetchMedicalRepId = async () => {
      if (!user || user.user_type !== "medical_rep") {
        setCurrentUserMedicalRepId(null);
        return;
      }

      try {
        const { data: medicalRep, error: repError } = await supabase
          .from("medical_reps")
          .select("id")
          .eq("profile_id", user.id)
          .eq("status", "active")
          .maybeSingle();

        if (repError) {
          console.error("Error fetching medical rep:", repError);
          setCurrentUserMedicalRepId(null);
          return;
        }

        if (medicalRep && (medicalRep as { id: string }).id) {
          setCurrentUserMedicalRepId((medicalRep as { id: string }).id);
        } else {
          setCurrentUserMedicalRepId(null);
        }
      } catch (error) {
        console.error("Error fetching medical rep ID:", error);
        setCurrentUserMedicalRepId(null);
      }
    };

    fetchMedicalRepId();
  }, [user]);

  // Fetch location hours when location changes
  useEffect(() => {
    const fetchLocationHours = async () => {
      if (!selectedLocationId) {
        setLocationHours([]);
        return;
      }

      try {
        const { data: hoursData, error: hoursError } = await supabase
          .from("location_hours")
          .select("id, day_of_week, open_time, close_time, is_closed")
          .eq("location_id", selectedLocationId)
          .order("day_of_week", { ascending: true });

        if (hoursError) {
          console.error("Error fetching location hours:", hoursError);
          setLocationHours([]);
          return;
        }

        setLocationHours((hoursData as LocationHours[]) || []);
      } catch (error) {
        console.error("Error fetching location hours:", error);
        setLocationHours([]);
      }
    };

    fetchLocationHours();
  }, [selectedLocationId]);

  // Helper function to check if a day is open
  const isDayOpen = useCallback(
    (dayOfWeek: number): boolean => {
      const hoursForDay = locationHours.find(
        (h) => h.day_of_week === dayOfWeek
      );
      if (!hoursForDay) return false; // No hours entry means closed
      return !hoursForDay.is_closed; // Check is_closed flag
    },
    [locationHours]
  );

  const dateOptions = useMemo(() => {
    const today = new Date();
    // Limit to 2 weeks (14 days) from today
    const allDates = Array.from({ length: 30 }).map((_, index) => {
      const date = addDays(today, index);
      const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
      return {
        key: format(date, "yyyy-MM-dd"),
        dayLabel: format(date, "EEE"),
        dayNumber: format(date, "d"),
        monthLabel: format(date, "MMM"),
        dayOfWeek,
      };
    });

    // Filter out days where the office is closed
    return allDates.filter((dateOption) => isDayOpen(dateOption.dayOfWeek));
  }, [isDayOpen]);

  // Reset selected date index if current selection is no longer valid
  useEffect(() => {
    if (selectedDateIndex >= dateOptions.length && dateOptions.length > 0) {
      setSelectedDateIndex(0);
      setSelectedTime(null);
    }
  }, [dateOptions.length, selectedDateIndex]);

  const selectedDate = dateOptions[selectedDateIndex]?.key ?? "";

  // Function to fetch all meetings for selected date
  const fetchAllDayMeetings = useCallback(
    async (forceRefresh = false) => {
      if (!selectedDate) {
        setAllDayMeetings([]);
        return;
      }

      try {
        // Clear existing data if forcing refresh
        if (forceRefresh) {
          setAllDayMeetings([]);
        }

        // Calculate start and end of day in ISO format
        const startOfDay = new Date(`${selectedDate}T00:00:00`);
        const endOfDay = new Date(`${selectedDate}T23:59:59`);

        // Fetch fresh data from Supabase (always query directly, don't rely on cache)
        const { data: meetingsData, error: meetingsError } = await supabase
          .from("meetings")
          .select("id, location_id, medical_rep_id, start_at, end_at, status")
          .gte("start_at", startOfDay.toISOString())
          .lt("start_at", endOfDay.toISOString())
          .in("status", ["pending", "approved", "completed"]);

        const meetings = (meetingsData as Meeting[]) || [];
        console.log("=== Fetching All Day Meetings ===");
        console.log("Date:", selectedDate);
        console.log("Fetched meetings:", meetings);
        console.log(
          "Meetings with cancelled status (should be 0):",
          meetings.filter((m) => m.status === "cancelled")
        );
        console.log("Total active meetings:", meetings.length);
        console.log("=== End Fetch ===");

        if (meetingsError) {
          console.error("Error fetching all day meetings:", meetingsError);
          setAllDayMeetings([]);
          return;
        }

        setAllDayMeetings(meetings);
      } catch (error) {
        console.error("Error fetching all day meetings:", error);
        setAllDayMeetings([]);
      }
    },
    [selectedDate]
  );

  // Fetch all meetings for selected date across all locations
  useEffect(() => {
    fetchAllDayMeetings(false);
  }, [fetchAllDayMeetings]);

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

  const dayMeetings = useMemo(() => {
    if (!selectedDate) return [] as Meeting[];
    return meetings.filter((meeting) => {
      const matchesDate = meeting.start_at.startsWith(selectedDate);
      const matchesLocation = selectedLocationId
        ? meeting.location_id === selectedLocationId
        : true;
      // Exclude cancelled and rejected meetings
      const isActive =
        meeting.status !== "cancelled" && meeting.status !== "rejected";
      return matchesDate && matchesLocation && isActive;
    });
  }, [meetings, selectedDate, selectedLocationId]);

  const dayMeetingTimes = useMemo(() => {
    return dayMeetings.map((meeting) =>
      format(new Date(meeting.start_at), "HH:mm")
    );
  }, [dayMeetings]);

  const loadAvailableSlots = React.useCallback(async () => {
    if (!selectedLocation || !selectedDate) return;

    try {
      setSlotsLoading(true);

      // Fetch fresh meetings for this date directly (don't rely on state to avoid race conditions)
      const startOfDay = new Date(`${selectedDate}T00:00:00`);
      const endOfDay = new Date(`${selectedDate}T23:59:59`);

      // Fetch meetings - explicitly exclude cancelled and rejected
      // Use .in() to only get active statuses (more reliable than .neq())
      const { data: meetingsData, error: meetingsError } = await supabase
        .from("meetings")
        .select("id, location_id, medical_rep_id, start_at, end_at, status")
        .gte("start_at", startOfDay.toISOString())
        .lt("start_at", endOfDay.toISOString())
        .in("status", ["pending", "approved", "completed"]);

      const freshMeetings = (meetingsData as Meeting[]) || [];
      console.log("=== Fresh Meetings Fetch in loadAvailableSlots ===");
      console.log("Date:", selectedDate);
      console.log("Query result - Total meetings found:", freshMeetings.length);
      if (freshMeetings.length > 0) {
        console.log("⚠️ WARNING: Found meetings that should be excluded:");
        freshMeetings.forEach((m, idx) => {
          console.log(
            `  Meeting ${idx + 1}: ID=${m.id}, Status=${m.status}, Start=${
              m.start_at
            }, End=${m.end_at}, Location=${m.location_id}`
          );
          if (m.status === "cancelled" || m.status === "rejected") {
            console.error(
              `  ❌ ERROR: Meeting ${m.id} has status "${m.status}" but should be excluded!`
            );
          }
        });
      } else {
        console.log("✅ No active meetings found for this date");
      }

      // Get day of week for the selected date
      // Parse the date string (format: "yyyy-MM-dd") and get day of week
      // JavaScript getDay(): 0=Sunday, 1=Monday, 2=Tuesday, etc.
      const [year, month, day] = selectedDate.split("-").map(Number);
      const selectedDateObj = new Date(year, month - 1, day); // month is 0-indexed in JS Date
      const dayOfWeek = selectedDateObj.getDay(); // 0 = Sunday, 1 = Monday, etc.

      // location_preferred_time_slots uses: 1=Monday, 2=Tuesday, 3=Wednesday, etc. (based on actual DB data)
      // location_hours uses: 0=Sunday, 1=Monday, 2=Tuesday, etc.
      // For preferred slots: Monday (JS=1) should be DB=1, Tuesday (JS=2) should be DB=2, etc.
      // Sunday (JS=0) should not be used (office closed), but if needed would be DB=7 or skip
      const dbDayOfWeekForPreferred = dayOfWeek === 0 ? null : dayOfWeek; // Use JS day directly (1-6), skip Sunday

      // Fetch location hours for this day
      const { data: locationHoursData, error: hoursError } = await supabase
        .from("location_hours")
        .select("day_of_week, open_time, close_time, is_closed")
        .eq("location_id", selectedLocation.id)
        .eq("day_of_week", dayOfWeek) // location_hours uses 0=Sunday format
        .maybeSingle();

      if (hoursError) {
        console.error("Error fetching location hours:", hoursError);
      }

      // Fetch providers for this location
      const { data: providersData, error: providersError } = await supabase
        .from("locations")
        .select("id, providers(id, first_name, last_name, credential, status)")
        .eq("id", selectedLocation.id)
        .single();

      const providersList =
        ((providersData as any)?.providers || []).filter(
          (p: any) => p.status === "active"
        ) || [];

      if (providersError) {
        console.error("Error fetching providers:", providersError);
      }

      // Fetch provider availability for this day
      const providerIds = providersList.map((p: any) => p.id);
      let availabilityData: any[] = [];
      if (providerIds.length > 0) {
        const { data: availabilityResult, error: availabilityError } =
          await supabase
            .from("provider_availability_effective")
            .select("provider_id, start_time, end_time, is_in_office_effective")
            .eq("location_id", selectedLocation.id)
            .eq("day_of_week", dayOfWeek)
            .eq("is_in_office_effective", true)
            .in("provider_id", providerIds);

        if (availabilityError) {
          console.error(
            "Error fetching provider availability:",
            availabilityError
          );
        } else {
          availabilityData = (availabilityResult || []) as any[];
        }
      }

      // Fetch preferred time slots for this location and day of week
      // Skip if Sunday (dayOfWeek === 0) since offices are closed
      let preferredSlotsData = null;
      let slotsError = null;

      if (dbDayOfWeekForPreferred !== null) {
        const result = await supabase
          .from("location_preferred_time_slots")
          .select("id, start_time, end_time, is_active")
          .eq("location_id", selectedLocation.id)
          .eq("day_of_week", dbDayOfWeekForPreferred)
          .eq("is_active", true);
        preferredSlotsData = result.data;
        slotsError = result.error;
      }

      // Debug logging
      console.log("=== Slot Loading Debug ===");
      console.log("Selected date:", selectedDate);
      console.log("Location ID:", selectedLocation.id);
      console.log(
        "Day of week (JS):",
        dayOfWeek,
        "(0=Sun, 1=Mon, 2=Tue, etc.)"
      );
      console.log(
        "Day of week (DB for preferred):",
        dbDayOfWeekForPreferred,
        "(1=Mon, 2=Tue, 3=Wed, etc.)"
      );
      console.log("Location hours data:", locationHoursData);
      console.log("Preferred slots query result:", preferredSlotsData);
      console.log("Preferred slots error:", slotsError);

      if (slotsError) {
        console.error("Error fetching preferred time slots:", slotsError);
        // Don't return early - still generate other slots even if preferred slots fail
      }

      // Helper function to parse time string to minutes
      const parseTimeToMinutes = (timeStr: string): number => {
        const [hour, min] = timeStr.split(":").map(Number);
        return hour * 60 + min;
      };

      // Helper function to format minutes to time string
      const formatMinutesToTime = (minutes: number): string => {
        const hour = Math.floor(minutes / 60);
        const min = minutes % 60;
        return `${String(hour).padStart(2, "0")}:${String(min).padStart(
          2,
          "0"
        )}`;
      };

      // Get office hours for this day
      const locationHours = locationHoursData as LocationHours | null;
      const isClosed =
        locationHours?.is_closed ||
        !locationHours?.open_time ||
        !locationHours?.close_time;

      console.log("Location hours:", locationHours);
      console.log("Is closed:", isClosed);
      console.log("Open time:", locationHours?.open_time);
      console.log("Close time:", locationHours?.close_time);

      // Generate all time slots
      const allSlots: TimeSlot[] = [];
      const preferredSlotTimes = new Set<string>();

      // Get current time to filter out past slots (only for today)
      const now = new Date();
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const selectedDateForComparison = new Date(year, month - 1, day);
      selectedDateForComparison.setHours(0, 0, 0, 0);
      const isToday = selectedDateForComparison.getTime() === today.getTime();

      // First, generate preferred slots (60-minute increments)
      if (preferredSlotsData && preferredSlotsData.length > 0) {
        console.log(
          "Generating preferred slots from",
          preferredSlotsData.length,
          "ranges"
        );
        (
          preferredSlotsData as Array<{ start_time: string; end_time: string }>
        ).forEach((slot) => {
          const startTime = slot.start_time;
          const endTime = slot.end_time;

          const startMinutes = parseTimeToMinutes(startTime);
          const endMinutes = parseTimeToMinutes(endTime);

          // Generate 60-minute slots within the preferred time range
          for (
            let minutes = startMinutes;
            minutes < endMinutes;
            minutes += 60
          ) {
            const timeString = formatMinutesToTime(minutes);

            // Check if this slot is in the past (only for today)
            if (isToday) {
              const [hour, minute] = timeString.split(":").map(Number);
              const slotStartTime = new Date(
                year,
                month - 1,
                day,
                hour,
                minute
              );

              // Skip slots that have already passed
              if (slotStartTime <= now) {
                continue;
              }
            }

            // Don't check availability here - let the overlap check handle it
            // This avoids using stale cached data
            preferredSlotTimes.add(timeString);

            allSlots.push({
              time: timeString,
              available: true, // Start as available, overlap check will update
              preferred: true,
              availableProviders: [],
            });
          }
        });
      }

      // Generate all other slots within office hours (60-minute increments)
      if (!isClosed && locationHours?.open_time && locationHours?.close_time) {
        const openMinutes = parseTimeToMinutes(locationHours.open_time);
        const closeMinutes = parseTimeToMinutes(locationHours.close_time);

        console.log(
          "Generating other slots from",
          formatMinutesToTime(openMinutes),
          "to",
          formatMinutesToTime(closeMinutes)
        );

        // Generate 60-minute slots for the entire day
        for (let minutes = openMinutes; minutes < closeMinutes; minutes += 60) {
          const timeString = formatMinutesToTime(minutes);

          // Skip if this is already a preferred slot
          if (preferredSlotTimes.has(timeString)) {
            continue;
          }

          // Check if this slot is in the past (only for today)
          if (isToday) {
            const [hour, minute] = timeString.split(":").map(Number);
            const slotStartTime = new Date(year, month - 1, day, hour, minute);

            // Skip slots that have already passed
            if (slotStartTime <= now) {
              continue;
            }
          }

          // Don't check availability here - let the overlap check handle it
          // This avoids using stale cached data
          allSlots.push({
            time: timeString,
            available: true, // Start as available, overlap check will update
            preferred: false,
            availableProviders: [],
          });
        }
      }

      // Check each slot for overlapping meetings using fresh data (not state)
      console.log("=== Overlap Check Debug ===");
      console.log("Total slots to check:", allSlots.length);
      console.log("Fresh meetings for overlap check:", freshMeetings.length);
      allSlots.forEach((slot) => {
        // Reset booking flags for this slot
        slot.isBooked = false;
        slot.bookedByCurrentUser = false;
        slot.available = true; // Start as available

        // Calculate slot start and end times
        // IMPORTANT: The slot time (e.g., "11:00") represents local time for the selected date
        // Meetings from database are in UTC, so we need to compare correctly
        const slotTimeMinutes = parseTimeToMinutes(slot.time);
        const [year, month, day] = selectedDate.split("-").map(Number);
        const [hour, minute] = slot.time.split(":").map(Number);

        // Create slot start time in local timezone (this represents what the user sees)
        // When compared to UTC dates, JavaScript handles the conversion
        const slotStartTime = new Date(year, month - 1, day, hour, minute);
        // All slots are 60 minutes (both preferred and other slots)
        const slotDuration = 60;
        const slotEndTime = new Date(
          slotStartTime.getTime() + slotDuration * 60 * 1000
        );

        // Check if any meeting overlaps with this slot
        // Only consider active meetings (exclude cancelled and rejected)
        // Use freshMeetings instead of allDayMeetings to avoid race conditions
        for (const meeting of freshMeetings) {
          // Skip cancelled or rejected meetings (shouldn't be in query, but double-check)
          if (meeting.status === "cancelled" || meeting.status === "rejected") {
            console.log(
              `Skipping cancelled/rejected meeting: ${meeting.id} (${meeting.status})`
            );
            continue;
          }

          const meetingStart = new Date(meeting.start_at);
          const meetingEnd = meeting.end_at
            ? new Date(meeting.end_at)
            : new Date(meetingStart.getTime() + 60 * 60 * 1000); // Default to 60 minutes if no end_at

          // Check for overlap: meeting overlaps if meeting.start_at < slot.end_at AND meeting.end_at > slot.start_at
          // Use getTime() for explicit timestamp comparison to avoid any timezone issues
          const slotStartMs = slotStartTime.getTime();
          const slotEndMs = slotEndTime.getTime();
          const meetingStartMs = meetingStart.getTime();
          const meetingEndMs = meetingEnd.getTime();

          const overlaps =
            meetingStartMs < slotEndMs && meetingEndMs > slotStartMs;

          if (overlaps) {
            console.log(
              `OVERLAP DETECTED: Slot ${
                slot.time
              } (${slotStartTime.toISOString()} - ${slotEndTime.toISOString()}, timestamps: ${slotStartMs} - ${slotEndMs}) overlaps with meeting ${
                meeting.id
              } (${meeting.start_at} - ${
                meeting.end_at
              }, timestamps: ${meetingStartMs} - ${meetingEndMs})`
            );
            console.log(
              `  Slot local time: ${slotStartTime.toLocaleString()} - ${slotEndTime.toLocaleString()}`
            );
            console.log(
              `  Meeting UTC: ${meetingStart.toISOString()} - ${meetingEnd.toISOString()}`
            );
            slot.isBooked = true;
            slot.available = false;

            // Check if this meeting was booked by the current user
            if (
              currentUserMedicalRepId &&
              meeting.medical_rep_id === currentUserMedicalRepId
            ) {
              slot.bookedByCurrentUser = true;
            } else {
              slot.bookedByCurrentUser = false;
            }
            break; // Found an overlap, no need to check other meetings
          }
        }
      });
      console.log("=== End Overlap Check Debug ===");

      // Calculate available providers for each slot
      allSlots.forEach((slot) => {
        const slotTimeMinutes = parseTimeToMinutes(slot.time);
        const slotEndMinutes = slotTimeMinutes + 60; // All slots are 60 minutes
        const slotStartTimeStr = formatMinutesToTime(slotTimeMinutes);
        const slotEndTimeStr = formatMinutesToTime(slotEndMinutes);

        const availableProviderNames: string[] = [];

        // Check each provider's availability
        providersList.forEach((provider: any) => {
          // Find availability data for this provider
          const providerAvailability = availabilityData.find(
            (avail: any) => avail.provider_id === provider.id
          );

          if (providerAvailability) {
            // Check if slot time falls within provider's time range
            const providerStartMinutes = parseTimeToMinutes(
              providerAvailability.start_time
            );
            const providerEndMinutes = parseTimeToMinutes(
              providerAvailability.end_time
            );

            // Slot overlaps if: slot.start < provider.end AND slot.end > provider.start
            const timeOverlaps =
              slotTimeMinutes < providerEndMinutes &&
              slotEndMinutes > providerStartMinutes;

            if (timeOverlaps) {
              // Format provider name: "First Last, Title"
              const providerName = `${provider.first_name} ${
                provider.last_name
              }${provider.credential ? `, ${provider.credential}` : ""}`;
              availableProviderNames.push(providerName);
            }
          }
        });

        slot.availableProviders = availableProviderNames;
      });

      // Update allDayMeetings state for consistency (even though we used freshMeetings above)
      setAllDayMeetings(freshMeetings);

      // Sort slots by time
      allSlots.sort((a, b) => a.time.localeCompare(b.time));

      console.log("Total slots generated:", allSlots.length);
      console.log(
        "Preferred slots:",
        allSlots.filter((s) => s.preferred).length
      );
      console.log("Other slots:", allSlots.filter((s) => !s.preferred).length);
      console.log(
        "Available slots:",
        allSlots.filter((s) => s.available).length
      );
      console.log("=== End Slot Loading Debug ===");

      setAvailableSlots(allSlots);
    } catch (error) {
      console.error("Error loading slots:", error);
      setAvailableSlots([]);
    } finally {
      setSlotsLoading(false);
    }
  }, [selectedLocation, selectedDate, currentUserMedicalRepId]);

  useEffect(() => {
    if (booking) return; // Don't reload slots during booking
    if (selectedLocation && selectedDate) {
      loadAvailableSlots();
    }
  }, [selectedLocation, selectedDate, loadAvailableSlots, booking]);

  // Refresh meetings when screen comes into focus (force refresh)
  // This only runs when navigating TO this screen, not when changing date/location within the screen
  useFocusEffect(
    useCallback(() => {
      if (booking) return; // Don't reload slots during booking
      console.log("Screen focused - refreshing time slots");
      // Just reload the slots for the current date
      // loadAvailableSlots fetches fresh data from DB internally
      if (selectedLocation && selectedDate) {
        loadAvailableSlots();
      }
    }, [loadAvailableSlots, selectedLocation, selectedDate, booking])
  );

  const formatTimeLabel = (time: string) => {
    const parsed = parse(time, "HH:mm", new Date());
    return format(parsed, "h:mm a");
  };

  const preferredSlots = availableSlots.filter((slot) => slot.preferred);
  const otherSlots = availableSlots.filter((slot) => !slot.preferred);

  const handleBookMeeting = async () => {
    if (!selectedLocation || !selectedDate || !selectedTime || !user) {
      Alert.alert(
        "Select Meeting Details",
        "Choose a location, date, and time to continue."
      );
      return;
    }

    setBooking(true);
    try {
      // Get user's medical_rep_id if they're a medical rep
      let medicalRepId: string | null = null;
      if (user.user_type === "medical_rep") {
        const { data: medicalRep, error: repError } = await supabase
          .from("medical_reps")
          .select("id")
          .eq("profile_id", user.id)
          .eq("status", "active")
          .maybeSingle();

        if (repError) {
          console.error("Error fetching medical rep:", repError);
          throw new Error("Unable to verify medical rep status");
        }

        if (medicalRep && (medicalRep as { id: string }).id) {
          medicalRepId = (medicalRep as { id: string }).id;
        } else {
          throw new Error("Medical rep not found");
        }
      } else {
        throw new Error("Only medical reps can book meetings");
      }

      // Calculate start and end times
      const startAt = new Date(`${selectedDate}T${selectedTime}:00`);
      const endAt = new Date(startAt.getTime() + 60 * 60 * 1000); // Add 60 minutes

      // Check if the selected time is in a preferred slot
      const selectedSlot = availableSlots.find(
        (slot) => slot.time === selectedTime
      );
      const isPreferredSlot = selectedSlot?.preferred ?? false;

      // If it's a preferred slot, auto-approve the meeting
      const meetingStatus = isPreferredSlot ? "approved" : "pending";
      const autoApproved = isPreferredSlot;
      const approvedAt = isPreferredSlot ? new Date().toISOString() : null;

      // Create meeting in Supabase
      const { data: newMeeting, error: meetingError } = await supabase
        .from("meetings")
        .insert({
          location_id: selectedLocation.id,
          medical_rep_id: medicalRepId,
          requested_by_profile_id: user.id,
          provider_id: null,
          food_preferences_id: null,
          meeting_type: "in_person",
          title: null,
          description: "Meeting booked via mobile app",
          start_at: startAt.toISOString(),
          end_at: endAt.toISOString(),
          status: meetingStatus,
          auto_approved: autoApproved,
          approved_by_profile_id: autoApproved ? user.id : null,
          approved_at: approvedAt,
        } as any)
        .select()
        .single();

      if (meetingError) {
        console.error("Error creating meeting:", meetingError);
        throw new Error("Unable to create meeting");
      }

      // Format date and time for toast message
      const formattedDate = format(new Date(selectedDate), "MMMM d, yyyy");
      const formattedTime = formatTimeLabel(selectedTime);

      // Reset form state
      setSelectedTime(null);
      setSelectedDateIndex(0);
      setSelectedLocationId(locations[0]?.id ?? null);

      // Prefetch data
      await prefetchTabData("calendar");
      await prefetchTabData("dashboard");

      // Navigate to dashboard with success params
      router.push({
        pathname: "/(tabs)/(dashboard)" as any,
        params: {
          bookingSuccess: "true",
          locationName: selectedLocation.name,
          meetingDate: formattedDate,
          meetingTime: formattedTime,
        },
      });
    } catch (error) {
      console.error("Error booking meeting:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Unable to schedule the meeting. Please try again.";
      Alert.alert("Error", errorMessage);
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
      {/* Full-page loader modal during booking */}
      <Modal visible={booking} transparent={true} animationType="fade">
        <View
          className="flex-1 items-center justify-center"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
        >
          <View className="bg-white rounded-xl p-6 items-center">
            <ActivityIndicator size="large" color="#0086c9" />
            <Text className="text-gray-900 font-medium mt-4">
              Booking meeting...
            </Text>
          </View>
        </View>
      </Modal>
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
                  <Text className="text-sm text-gray-500">
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
                  ? meeting.location_id === selectedLocationId
                  : true;
                return (
                  matchesLocation && meeting.start_at.startsWith(dateOption.key)
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
                  <Text className="text-xs font-bold uppercase text-gray-600">
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
                  <Text className="text-xl font-semibold text-gray-900">
                    {dateOption.dayNumber}
                  </Text>
                  <Text className="text-xs text-gray-500">
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
                (loc) => loc.id === meeting.location_id
              );
              return (
                <View key={meeting.id} className="mb-3 last:mb-0">
                  <Text className="text-sm font-semibold text-gray-900">
                    {meeting.location?.name ||
                      meeting.title ||
                      location?.name ||
                      "Meeting"}
                  </Text>
                  <View className="flex-row items-center mt-1">
                    <ClockIcon size={14} color="#6b7280" />
                    <Text className="text-xs text-gray-600 ml-2">
                      {format(new Date(meeting.start_at), "h:mm a")}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Preferred slots */}
        <View className="mb-6">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-base font-semibold text-gray-800">
              Preferred Times
            </Text>
            <View className="flex-row items-center">
              <Text className="text-xs text-gray-600 mr-2">
                Available providers
              </Text>
              <Switch
                value={showProviders}
                onValueChange={setShowProviders}
                trackColor={{ false: "#d1d5db", true: "#0086c9" }}
                thumbColor="#ffffff"
                style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
              />
            </View>
          </View>
          {!selectedLocation ? (
            <Text className="text-gray-500 text-sm">
              Select a location to view preferred times.
            </Text>
          ) : slotsLoading ? (
            <ActivityIndicator color="#0086c9" />
          ) : preferredSlots.length > 0 ? (
            preferredSlots.map((slot) => {
              const isSelected = selectedTime === slot.time;
              const disabled = !slot.available || slot.isBooked;
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
                  <View className="flex-1">
                    <View className="flex-row items-center justify-between">
                      <View className="flex-column">
                        <View className="flex-row items-center">
                          <Text
                            className={`text-lg font-semibold ${
                              disabled ? "text-gray-400" : "text-gray-900"
                            }`}
                          >
                            {formatTimeLabel(slot.time)}
                          </Text>
                          {slot.isBooked && (
                            <View
                              className={`px-2 py-1 ml-2 rounded-full ${
                                slot.bookedByCurrentUser
                                  ? "bg-blue-100"
                                  : "bg-gray-200"
                              }`}
                            >
                              <Text
                                className={`text-xs font-semibold ${
                                  slot.bookedByCurrentUser
                                    ? "text-blue-700"
                                    : "text-gray-600"
                                }`}
                              >
                                {slot.bookedByCurrentUser
                                  ? "Booked by you"
                                  : "Booked"}
                              </Text>
                            </View>
                          )}
                        </View>
                        {showProviders && (
                          <View className="mt-2">
                            {slot.availableProviders &&
                            slot.availableProviders.length > 0 ? (
                              slot.availableProviders.map((provider, idx) => (
                                <View
                                  key={idx}
                                  className="flex-row items-center mb-1"
                                >
                                  <View
                                    className="rounded-full mr-2"
                                    style={{
                                      width: 12,
                                      height: 12,
                                      backgroundColor: "#10b981",
                                      alignItems: "center",
                                      justifyContent: "center",
                                    }}
                                  >
                                    <View
                                      style={{
                                        width: 6,
                                        height: 6,
                                        backgroundColor: "white",
                                        borderRadius: 3,
                                      }}
                                    />
                                  </View>
                                  <Text
                                    className={`text-xs ${
                                      disabled
                                        ? "text-gray-400"
                                        : "text-gray-500"
                                    }`}
                                  >
                                    {provider}
                                  </Text>
                                </View>
                              ))
                            ) : (
                              <Text
                                className={`text-xs ${
                                  disabled ? "text-gray-400" : "text-gray-500"
                                }`}
                              >
                                No providers available
                              </Text>
                            )}
                          </View>
                        )}
                      </View>
                    </View>
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
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-base font-semibold text-gray-800">
              All Other Times
            </Text>
            <View className="flex-row items-center">
              <Text className="text-xs text-gray-600 mr-2">
                Available providers
              </Text>
              <Switch
                value={showProviders}
                onValueChange={setShowProviders}
                trackColor={{ false: "#d1d5db", true: "#0086c9" }}
                thumbColor="#ffffff"
                style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
              />
            </View>
          </View>
          {!selectedLocation ? (
            <Text className="text-gray-500 text-sm">
              Choose a location to see all available times.
            </Text>
          ) : slotsLoading ? (
            <ActivityIndicator color="#0086c9" />
          ) : otherSlots.length > 0 ? (
            otherSlots.map((slot) => {
              const isSelected = selectedTime === slot.time;
              const disabled = !slot.available || slot.isBooked;
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
                  <View className="flex-1">
                    <View className="flex-row items-center justify-between">
                      <View className="flex-column">
                        <View className="flex-row items-center">
                          <Text
                            className={`text-lg font-semibold ${
                              disabled ? "text-gray-400" : "text-gray-900"
                            }`}
                          >
                            {formatTimeLabel(slot.time)}
                          </Text>
                          {slot.isBooked && (
                            <View
                              className={`px-2 py-1 ml-2 rounded-full ${
                                slot.bookedByCurrentUser
                                  ? "bg-blue-100"
                                  : "bg-gray-200"
                              }`}
                            >
                              <Text
                                className={`text-xs font-semibold ${
                                  slot.bookedByCurrentUser
                                    ? "text-blue-700"
                                    : "text-gray-600"
                                }`}
                              >
                                {slot.bookedByCurrentUser
                                  ? "Booked by you"
                                  : "Booked"}
                              </Text>
                            </View>
                          )}
                        </View>
                        {showProviders && (
                          <View className="mt-2">
                            {slot.availableProviders &&
                            slot.availableProviders.length > 0 ? (
                              slot.availableProviders.map((provider, idx) => (
                                <View
                                  key={idx}
                                  className="flex-row items-center mb-1"
                                >
                                  <View
                                    className="rounded-full mr-2"
                                    style={{
                                      width: 12,
                                      height: 12,
                                      backgroundColor: "#10b981",
                                      alignItems: "center",
                                      justifyContent: "center",
                                    }}
                                  >
                                    <View
                                      style={{
                                        width: 6,
                                        height: 6,
                                        backgroundColor: "white",
                                        borderRadius: 3,
                                      }}
                                    />
                                  </View>
                                  <Text
                                    className={`text-xs ${
                                      disabled
                                        ? "text-gray-400"
                                        : "text-gray-500"
                                    }`}
                                  >
                                    {provider}
                                  </Text>
                                </View>
                              ))
                            ) : (
                              <Text
                                className={`text-xs ${
                                  disabled ? "text-gray-400" : "text-gray-500"
                                }`}
                              >
                                No providers available
                              </Text>
                            )}
                          </View>
                        )}
                      </View>
                    </View>
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
              Future Meetings
            </Text>
            {meetings.slice(0, 3).map((meeting) => {
              const location = locations.find(
                (loc) => loc.id === meeting.location_id
              );
              return (
                <View key={meeting.id} className="mb-3 last:mb-0">
                  <Text className="text-sm font-semibold text-gray-900">
                    {location?.name || "Medical Office"}
                  </Text>
                  <View className="flex-row items-center mt-1">
                    <CalendarIcon size={14} color="#6b7280" />
                    <Text className="text-xs text-gray-600 ml-2">
                      {format(new Date(meeting.start_at), "MMMM d, yyyy")}
                    </Text>
                  </View>
                  <View className="flex-row items-center mt-1">
                    <ClockIcon size={14} color="#6b7280" />
                    <Text className="text-xs text-gray-600 ml-2">
                      {format(new Date(meeting.start_at), "h:mm a")}
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
            <Text className="text-white font-semibold text-lg">
              Book meeting
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
