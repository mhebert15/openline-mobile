import { Stack } from "expo-router";

export default function MessagesLayout() {
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
          headerTitle: "Messages",
        }}
      />
      <Stack.Screen
        name="message-detail"
        options={({ route }) => ({
          headerTitle: (route.params as any)?.recipientName || "Message",
        })}
      />
    </Stack>
  );
}
