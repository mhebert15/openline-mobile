import { Stack } from "expo-router";

export default function LocationsLayout() {
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
        name="index"
        options={{
          headerTitle: "Locations",
        }}
      />
      <Stack.Screen
        name="location-detail"
        options={{
          headerTitle: "Location Details",
        }}
      />
    </Stack>
  );
}
