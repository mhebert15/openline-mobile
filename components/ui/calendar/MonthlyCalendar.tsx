import React from "react";
import { View, TouchableOpacity, Text } from "react-native";
import { Calendar } from "react-native-calendars";
import { parseISO, format } from "date-fns";
import { calendarStyles } from "./calendarStyles";

type MeetingsByDate = Record<
  string,
  import("@/lib/types/database.types").Meeting[]
>;

type DayComponentProps = {
  date?: {
    dateString: string;
    day: number;
    month: number;
    year: number;
  };
  state?: string;
};

interface MonthlyCalendarProps {
  currentDateString: string;
  markedDates: Record<string, any>;
  meetingsByDate: MeetingsByDate;
  onSelectDate: (date: Date) => void;
  onMonthChange: (year: number, month: number) => void;
  officeNameResolver: (
    meeting: import("@/lib/types/database.types").Meeting
  ) => string;
}

export function MonthlyCalendar({
  currentDateString,
  markedDates,
  meetingsByDate,
  onSelectDate,
  onMonthChange,
  officeNameResolver,
}: MonthlyCalendarProps) {
  return (
    <View className="mb-4">
      <Calendar
        current={currentDateString}
        markedDates={markedDates}
        onDayPress={({ dateString }) => onSelectDate(parseISO(dateString))}
        onMonthChange={({ year, month }) => onMonthChange(year, month)}
        theme={{
          todayTextColor: "#0086c9",
          arrowColor: "#0086c9",
        }}
        renderHeader={(dateObj: any) => {
          const headerDate =
            dateObj instanceof Date ? dateObj : parseISO(currentDateString);
          const label = format(headerDate, "MMMM yyyy");
          return (
            <View className="py-2 items-center">
              <Text className="text-lg font-semibold text-gray-900">
                {label}
              </Text>
            </View>
          );
        }}
        dayComponent={({ date, state }: DayComponentProps) => {
          if (!date) {
            return <View style={calendarStyles.dayCell} />;
          }

          const dateString = date.dateString;
          const dayMeetings = (meetingsByDate[dateString] || []).slice(0, 2);
          const isSelected = currentDateString === dateString;

          return (
            <TouchableOpacity
              style={[
                calendarStyles.dayCell,
                isSelected && calendarStyles.dayCellSelected,
              ]}
              onPress={() => onSelectDate(parseISO(dateString))}
            >
              <Text
                style={[
                  calendarStyles.dayNumber,
                  state === "disabled" && calendarStyles.dayNumberDisabled,
                  isSelected && calendarStyles.dayNumberSelected,
                ]}
              >
                {date.day}
              </Text>
              {dayMeetings.map((meeting) => (
                <Text
                  key={meeting.id}
                  numberOfLines={1}
                  style={calendarStyles.dayMeetingText}
                >
                  {officeNameResolver(meeting)}
                </Text>
              ))}
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}
