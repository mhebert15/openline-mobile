import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  PanResponder,
} from "react-native";
import type { MedicalOffice, Meeting } from "@/lib/types/database.types";
import { ChevronDown } from "lucide-react-native";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useDataCache } from "@/lib/contexts/DataCacheContext";
import { AnimatedTabScreen } from "@/components/AnimatedTabScreen";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { addDays, addWeeks, format, startOfWeek } from "date-fns";

import { MonthlyCalendar } from "@/components/ui/calendar/MonthlyCalendar";
import { WeeklyCalendar } from "@/components/ui/calendar/WeeklyCalendar";
import { DailyCalendar } from "@/components/ui/calendar/DailyCalendar";
import {
  START_HOUR,
  HOUR_HEIGHT,
} from "@/components/ui/calendar/calendarStyles";

type CalendarViewMode = "monthly" | "weekly" | "daily";

const VIEW_OPTIONS: { label: string; mode: CalendarViewMode }[] = [
  { label: "Monthly", mode: "monthly" },
  { label: "Weekly", mode: "weekly" },
  { label: "Daily", mode: "daily" },
];

function CalendarScreen() {
  const { user } = useAuth();
  const { cache, prefetchTabData, isLoading } = useDataCache();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [activeDate, setActiveDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<CalendarViewMode>("monthly");
  const [viewSelectorVisible, setViewSelectorVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [buttonLayout, setButtonLayout] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  const buttonRef = useRef<View>(null);

  const meetings = (cache.calendar.meetings.data as Meeting[]) || [];
  const locations = (cache.calendar.locations.data as MedicalOffice[]) || [];

  const loading =
    isLoading("calendar") && meetings.length === 0 && locations.length === 0;

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

  const locationMap = useMemo(() => {
    const map = new Map<string, MedicalOffice>();
    locations.forEach((location) => map.set(location.id, location));
    return map;
  }, [locations]);

  const meetingsByDate = useMemo(() => {
    const map: Record<string, Meeting[]> = {};
    meetings.forEach((meeting) => {
      const dateStr = meeting.start_at.split("T")[0];
      if (!map[dateStr]) {
        map[dateStr] = [];
      }
      map[dateStr].push(meeting);
    });
    return map;
  }, [meetings]);

  const selectedDateString = useMemo(
    () => format(activeDate, "yyyy-MM-dd"),
    [activeDate]
  );

  const getMarkedDates = () => {
    if (viewMode !== "monthly") {
      return {};
    }

    const marked: Record<string, any> = {};

    Object.keys(meetingsByDate).forEach((dateStr) => {
      marked[dateStr] = {
        marked: true,
        dotColor: "#0086c9",
      };
    });

    marked[selectedDateString] = {
      ...(marked[selectedDateString] || {}),
      selected: true,
      selectedColor: "#0086c9",
    };

    return marked;
  };

  const weekStartDate = useMemo(
    () => startOfWeek(activeDate, { weekStartsOn: 0 }),
    [activeDate]
  );

  const weekDays = useMemo(
    () =>
      Array.from({ length: 7 }, (_, index) => addDays(weekStartDate, index)),
    [weekStartDate]
  );

  const weekLabel = useMemo(() => {
    const startLabel = format(weekStartDate, "MMM d");
    const endLabel = format(addDays(weekStartDate, 6), "MMM d");
    return `${startLabel} - ${endLabel}`;
  }, [weekStartDate]);

  const weeklyPanResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gesture) =>
          Math.abs(gesture.dx) > Math.abs(gesture.dy) &&
          Math.abs(gesture.dx) > 12,
        onPanResponderRelease: (_, gesture) => {
          if (gesture.dx < -40) {
            setActiveDate(addWeeks(activeDate, 1));
          } else if (gesture.dx > 40) {
            setActiveDate(addWeeks(activeDate, -1));
          }
        },
      }),
    [activeDate]
  );

  const dailyPanResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gesture) =>
          Math.abs(gesture.dx) > Math.abs(gesture.dy) &&
          Math.abs(gesture.dx) > 12,
        onPanResponderRelease: (_, gesture) => {
          if (gesture.dx < -40) {
            setActiveDate(addDays(activeDate, 1));
          } else if (gesture.dx > 40) {
            setActiveDate(addDays(activeDate, -1));
          }
        },
      }),
    [activeDate]
  );

  const weeklyScrollRef = useRef<ScrollView | null>(null);
  const dailyScrollRef = useRef<ScrollView | null>(null);

  useEffect(() => {
    if (viewMode === "weekly" && weeklyScrollRef.current) {
      weeklyScrollRef.current.scrollTo({
        y: Math.max(0, (START_HOUR - 1) * HOUR_HEIGHT),
        animated: false,
      });
    }
  }, [viewMode]);

  useEffect(() => {
    if (viewMode === "daily" && dailyScrollRef.current) {
      dailyScrollRef.current.scrollTo({
        y: Math.max(0, (START_HOUR - 1) * HOUR_HEIGHT),
        animated: false,
      });
    }
  }, [viewMode]);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#0086c9" />
      </View>
    );
  }

  const officeNameResolver = (meeting: Meeting) =>
    meeting.location?.name ||
    locationMap.get(meeting.location_id)?.name ||
    meeting.title ||
    "Meeting";

  return (
    <View className="flex-1 bg-gray-50">
      <View
        style={{ paddingTop: insets.top || 0 }}
        className="bg-gray-50 mt-2 mb-2"
      >
        <View className="flex-row items-center justify-center">
          <View
            ref={buttonRef}
            onLayout={(event) => {
              const { x, y, width, height } = event.nativeEvent.layout;
              buttonRef.current?.measureInWindow((px, py, fwidth, fheight) => {
                setButtonLayout({
                  x: px,
                  y: py,
                  width: fwidth,
                  height: fheight,
                });
              });
            }}
          >
            <TouchableOpacity
              className="flex-row items-center px-4 py-2"
              onPress={() => {
                buttonRef.current?.measureInWindow(
                  (px, py, fwidth, fheight) => {
                    setButtonLayout({
                      x: px,
                      y: py,
                      width: fwidth,
                      height: fheight,
                    });
                    setViewSelectorVisible(true);
                  }
                );
              }}
            >
              <Text className="text-gray-900 text-lg mr-2 font-semibold">
                {VIEW_OPTIONS.find((option) => option.mode === viewMode)
                  ?.label ?? "Monthly"}
              </Text>
              <ChevronDown size={20} color="#6b7280" />
            </TouchableOpacity>
          </View>
          {viewMode !== "monthly" && (
            <Text className="text-sm text-gray-500 ml-4">
              {viewMode === "weekly"
                ? weekLabel
                : format(activeDate, "EEEE, MMM d")}
            </Text>
          )}
        </View>
      </View>
      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View>
          {viewMode === "monthly" && (
            <MonthlyCalendar
              currentDateString={selectedDateString}
              markedDates={getMarkedDates()}
              meetingsByDate={meetingsByDate}
              onSelectDate={(date) => setActiveDate(date)}
              onMonthChange={(year, month) =>
                setActiveDate(new Date(year, month - 1, 1))
              }
              officeNameResolver={officeNameResolver}
            />
          )}

          {viewMode === "weekly" && (
            <WeeklyCalendar
              weekLabel={weekLabel}
              weekDays={weekDays}
              selectedDateString={selectedDateString}
              meetingsByDate={meetingsByDate}
              officeNameResolver={officeNameResolver}
              onSelectDate={(date) => setActiveDate(date)}
              scrollRef={weeklyScrollRef}
              panHandlers={weeklyPanResponder.panHandlers}
            />
          )}

          {viewMode === "daily" && (
            <DailyCalendar
              activeDate={activeDate}
              selectedDateString={selectedDateString}
              meetingsByDate={meetingsByDate}
              officeNameResolver={officeNameResolver}
              scrollRef={dailyScrollRef}
              panHandlers={dailyPanResponder.panHandlers}
            />
          )}
        </View>
      </ScrollView>

      <View className="p-4 bg-white border-t border-gray-200">
        <TouchableOpacity
          className="rounded-xl p-4 flex-row items-center justify-center"
          style={{ backgroundColor: "#0086c9" }}
          onPress={() => router.push("/book-meeting")}
        >
          <Text className="text-white font-semibold text-lg">
            Book a meeting
          </Text>
        </TouchableOpacity>
      </View>

      {viewSelectorVisible && (
        <>
          <TouchableOpacity
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 999,
            }}
            activeOpacity={1}
            onPress={() => setViewSelectorVisible(false)}
          />
          {buttonLayout && (
            <View
              style={{
                position: "absolute",
                top: buttonLayout.y + buttonLayout.height + 8,
                left: buttonLayout.x + buttonLayout.width / 2,
                zIndex: 1000,
                transform: [{ translateX: -70 }], // Half of estimated menu width (140px)
                backgroundColor: "#ffffff",
                borderRadius: 12,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
                elevation: 5,
                minWidth: 140,
                paddingVertical: 8,
              }}
            >
              {VIEW_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.mode}
                  className="px-4 py-3"
                  onPress={() => {
                    setViewMode(option.mode);
                    setViewSelectorVisible(false);
                  }}
                >
                  <Text
                    className={`text-lg text-center ${
                      option.mode === viewMode
                        ? "text-[#0086c9] font-semibold"
                        : "text-gray-900"
                    }`}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </>
      )}
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
