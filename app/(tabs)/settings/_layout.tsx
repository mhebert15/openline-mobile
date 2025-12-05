import { Stack, useRouter } from "expo-router";
import { TouchableOpacity, Text } from "react-native";
import { getOpenEditSheetFn } from "@/lib/utils/edit-sheet-utils";

export default function SettingsLayout() {
  const router = useRouter();

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
        headerBackButtonDisplayMode: "minimal",
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          headerTitle: "Settings",
        }}
      />
      <Stack.Screen
        name="profile-settings"
        options={{
          headerTitle: "Profile Settings",
          headerRight: () => (
            <TouchableOpacity
              style={{ padding: 8 }}
              onPress={() => {
                console.log("Edit button pressed");
                // Try direct call first (more reliable)
                const openFn = getOpenEditSheetFn();
                console.log("Open function:", openFn);
                if (openFn) {
                  openFn();
                } else {
                  // Fallback to router params
                  console.log("Falling back to router params");
                  router.setParams({ openEdit: "true" });
                }
              }}
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
      <Stack.Screen
        name="notification-settings"
        options={{
          headerTitle: "Notification Settings",
        }}
      />
      <Stack.Screen
        name="privacy-security"
        options={{
          headerTitle: "Privacy & Security",
        }}
      />
      <Stack.Screen
        name="help-support"
        options={{
          headerTitle: "Help & Support",
        }}
      />
    </Stack>
  );
}
