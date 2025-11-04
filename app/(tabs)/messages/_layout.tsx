import { Stack } from "expo-router";
import { ArrowLeftIcon } from "lucide-react-native";
import { TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";

function BackToMessagesButton() {
  const router = useRouter();
  return (
    <TouchableOpacity
      onPress={() => router.push("/(tabs)/messages")}
      style={{ marginLeft: 16 }}
    >
      <ArrowLeftIcon size={24} color="#111827" />
    </TouchableOpacity>
  );
}

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
          headerLeft: () => <BackToMessagesButton />,
        })}
      />
    </Stack>
  );
}
