import { Stack } from "expo-router";

export default function StandaloneLayout() {
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
        headerBackTitle: "Back",
      }}
    >
      <Stack.Screen
        name="book-meeting"
        options={{
          title: "Book a meeting",
          presentation: "card",
        }}
      />
    </Stack>
  );
}
