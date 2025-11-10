import { Stack } from "expo-router";

export default function NotificationsLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: "#ffffff",
        },
        headerTintColor: "#111827",
        headerTitleStyle: {
          fontWeight: "600",
        },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          headerTitle: "Notifications",
        }}
      />
    </Stack>
  );
}
