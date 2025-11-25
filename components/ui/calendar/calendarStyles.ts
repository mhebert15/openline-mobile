import { StyleSheet } from "react-native";

export const HOURS = Array.from({ length: 24 }, (_, index) => index);
export const START_HOUR = 6;
export const END_HOUR = 22;
export const HOUR_HEIGHT = 64;

export const calendarStyles = StyleSheet.create({
  dayCell: {
    alignItems: "flex-start",
    justifyContent: "flex-start",
    padding: 4,
    borderRadius: 10,
    height: 60,
  } as any,
  dayCellSelected: {
    backgroundColor: "#0086c915",
  },
  dayNumber: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  dayNumberDisabled: {
    color: "#d1d5db",
  },
  dayNumberSelected: {
    color: "#0086c9",
  },
  dayMeetingText: {
    fontSize: 10,
    color: "#6b7280",
  },
  timelineContainer: {
    flexDirection: "row",
    minHeight: (END_HOUR - START_HOUR + 2) * HOUR_HEIGHT,
  },
  timelineHoursColumn: {
    width: 56,
    paddingTop: 16,
  },
  timelineHourRow: {
    height: HOUR_HEIGHT,
    justifyContent: "flex-start",
  },
  timelineDaysContainer: {
    flex: 1,
    flexDirection: "row",
  },
  timelineDayColumn: {
    flex: 1,
    minHeight: (END_HOUR - START_HOUR + 2) * HOUR_HEIGHT,
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderLeftColor: "#e5e7eb",
  },
  timelineDayBackground: {
    ...StyleSheet.absoluteFillObject,
  },
  timelineHourDivider: {
    height: HOUR_HEIGHT,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#f3f4f6",
  },
  timelineHourHighlight: {
    borderBottomColor: "#e0f2fe",
  },
  eventBlock: {
    position: "absolute",
    left: 6,
    right: 6,
    borderRadius: 12,
    borderWidth: 1,
    padding: 8,
  },
})


