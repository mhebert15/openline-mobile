import React, { MutableRefObject } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { format, parseISO } from "date-fns";
import {
  calendarStyles,
  HOURS,
  START_HOUR,
  END_HOUR,
  HOUR_HEIGHT,
} from "./calendarStyles";
import type { Meeting } from "@/lib/types/database.types";

interface WeeklyCalendarProps {
  weekLabel: string;
  weekDays: Date[];
  selectedDateString: string;
  meetingsByDate: Record<string, Meeting[]>;
  officeNameResolver: (meeting: Meeting) => string;
  onSelectDate: (date: Date) => void;
  scrollRef: MutableRefObject<ScrollView | null>;
  panHandlers: any;
}

export function WeeklyCalendar({
  weekLabel,
  weekDays,
  selectedDateString,
  meetingsByDate,
  officeNameResolver,
  onSelectDate,
  scrollRef,
  panHandlers,
}: WeeklyCalendarProps) {
  return (
    <View className="bg-white rounded-xl p-4 mb-4 shadow-sm" {...panHandlers}>
      <View className="flex-row justify-between items-center mb-3 px-2">
        <Text className="text-sm text-gray-500 flex-1">{weekLabel}</Text>
        {weekDays.map((day) => (
          <View
            key={day.toISOString()}
            style={{ flex: 1, alignItems: "center" }}
          >
            <Text className="text-xs text-gray-500">{format(day, "EEE")}</Text>
            <TouchableOpacity
              onPress={() => onSelectDate(day)}
              style={{ paddingTop: 4 }}
            >
              <Text
                className={`text-base font-semibold ${
                  format(day, "yyyy-MM-dd") === selectedDateString
                    ? "text-[#0086c9]"
                    : "text-gray-900"
                }`}
              >
                {format(day, "d")}
              </Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>

      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
      >
        <View style={calendarStyles.timelineContainer}>
          <View style={calendarStyles.timelineHoursColumn}>
            {HOURS.map((hour) => (
              <View key={hour} style={calendarStyles.timelineHourRow}>
                <Text className="text-xs text-gray-400">
                  {format(new Date().setHours(hour, 0, 0, 0), "ha")}
                </Text>
              </View>
            ))}
          </View>
          <View style={calendarStyles.timelineDaysContainer}>
            {weekDays.map((day) => {
              const dateKey = format(day, "yyyy-MM-dd");
              const dayMeetings = meetingsByDate[dateKey] || [];
              return (
                <View key={dateKey} style={calendarStyles.timelineDayColumn}>
                  <View style={calendarStyles.timelineDayBackground}>
                    {HOURS.map((hour) => (
                      <View
                        key={`${dateKey}-${hour}`}
                        style={[
                          calendarStyles.timelineHourDivider,
                          hour === START_HOUR &&
                            calendarStyles.timelineHourHighlight,
                        ]}
                      />
                    ))}
                  </View>
                  <View style={StyleSheet.absoluteFillObject}>
                    {dayMeetings.map((meeting) => {
                      const start = parseISO(meeting.scheduled_at);
                      const startMinutes =
                        start.getHours() * 60 + start.getMinutes();
                      const endMinutes =
                        startMinutes + (meeting.duration_minutes || 30);
                      const clampedStart = Math.max(
                        START_HOUR * 60,
                        startMinutes
                      );
                      const clampedEnd = Math.min(END_HOUR * 60, endMinutes);
                      if (clampedEnd <= START_HOUR * 60) {
                        return null;
                      }
                      const top =
                        ((clampedStart - START_HOUR * 60) / 60) * HOUR_HEIGHT;
                      const height = Math.max(
                        36,
                        ((clampedEnd - clampedStart) / 60) * HOUR_HEIGHT
                      );

                      return (
                        <View
                          key={meeting.id}
                          style={[
                            calendarStyles.eventBlock,
                            {
                              top,
                              height,
                              backgroundColor: "#0086c914",
                              borderColor: "#0086c9",
                            },
                          ]}
                        >
                          <Text
                            className="text-xs font-semibold text-[#0086c9]"
                            numberOfLines={2}
                          >
                            {officeNameResolver(meeting)}
                          </Text>
                          <Text className="text-[10px] text-gray-500 mt-1">
                            {format(start, "h:mm a")}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
