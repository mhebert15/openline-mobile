import { Stack } from "expo-router";
import { TouchableOpacity, Text, Alert } from "react-native";

export default function DashboardLayout() {
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
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="meeting-detail"
        options={{
          headerTitle: "View Meeting",
          headerBackTitle: "Back",
          headerRight: () => (
            <TouchableOpacity
              style={{ padding: 8 }}
              onPress={() =>
                Alert.alert("Edit meeting", "Meeting editing coming soon")
              }
            >
              <Text
                style={{
                  color: "#0086c9",
                  fontWeight: "600",
                  fontSize: 16,
                }}
              >
                Edit
              </Text>
            </TouchableOpacity>
          ),
        }}
      />
    </Stack>
  );
}
