import React, { MutableRefObject } from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { format, parseISO } from "date-fns";
import {
  calendarStyles,
  HOURS,
  START_HOUR,
  END_HOUR,
  HOUR_HEIGHT,
} from "./calendarStyles";
import type { Meeting } from "@/lib/types/database.types";

interface DailyCalendarProps {
  activeDate: Date;
  selectedDateString: string;
  meetingsByDate: Record<string, Meeting[]>;
  officeNameResolver: (meeting: Meeting) => string;
  scrollRef: MutableRefObject<ScrollView | null>;
  panHandlers: any;
}

export function DailyCalendar({
  activeDate,
  selectedDateString,
  meetingsByDate,
  officeNameResolver,
  scrollRef,
  panHandlers,
}: DailyCalendarProps) {
  const dayMeetings = meetingsByDate[selectedDateString] || [];

  return (
    <View className="bg-white rounded-xl p-4 mb-4 shadow-sm" {...panHandlers}>
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-lg font-semibold text-gray-900">
          {format(activeDate, "EEEE, MMM d")}
        </Text>
        <Text className="text-sm text-gray-500">
          {format(activeDate, "yyyy")}
        </Text>
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
          <View style={[calendarStyles.timelineDayColumn, { flex: 1 }]}>
            <View style={calendarStyles.timelineDayBackground}>
              {HOURS.map((hour) => (
                <View
                  key={`daily-${hour}`}
                  style={[
                    calendarStyles.timelineHourDivider,
                    hour === START_HOUR && calendarStyles.timelineHourHighlight,
                  ]}
                />
              ))}
            </View>
            <View style={StyleSheet.absoluteFillObject}>
              {dayMeetings.map((meeting) => {
                const start = parseISO(meeting.start_at);
                const startMinutes = start.getHours() * 60 + start.getMinutes();
                const end = meeting.end_at ? parseISO(meeting.end_at) : null;
                const endMinutes = end
                  ? end.getHours() * 60 + end.getMinutes()
                  : startMinutes + 30; // Default 30 minutes if no end time
                const clampedStart = Math.max(START_HOUR * 60, startMinutes);
                const clampedEnd = Math.min(END_HOUR * 60, endMinutes);
                if (clampedEnd <= START_HOUR * 60) {
                  return null;
                }
                const top =
                  ((clampedStart - START_HOUR * 60) / 60) * HOUR_HEIGHT;
                const height = Math.max(
                  48,
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
                        backgroundColor: "#0086c930",
                        borderColor: "#0086c9",
                      },
                    ]}
                  >
                    <Text className="text-xs font-semibold text-[#0086c9]">
                      {officeNameResolver(meeting)}
                    </Text>
                    <Text className="text-[11px] text-gray-700 mt-1">
                      {format(start, "h:mm a")}
                      {end ? ` - ${format(end, "h:mm a")}` : ""} •{" "}
                      {Math.round((endMinutes - startMinutes) / 60) * 60 ===
                      endMinutes - startMinutes
                        ? (endMinutes - startMinutes) / 60
                        : Math.round((endMinutes - startMinutes) / 60)}{" "}
                      mins
                    </Text>
                    {meeting.description && (
                      <Text
                        numberOfLines={2}
                        className="text-[10px] text-gray-500 mt-1"
                      >
                        {meeting.description}
                      </Text>
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
