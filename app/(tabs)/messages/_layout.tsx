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
        headerBackButtonDisplayMode: "minimal",
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
        options={({ route }) => {
          const params = route.params as any;
          const title = params?.participantId
            ? params?.participantName || "Message"
            : params?.locationName || "Message";

          const truncatedTitle =
            title.length > 30 ? `${title.substring(0, 27)}...` : title;

          return {
            headerTitle: truncatedTitle,
          };
        }}
      />
    </Stack>
  );
}
