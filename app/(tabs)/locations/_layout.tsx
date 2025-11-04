import { Stack } from "expo-router";
import { ArrowLeftIcon } from "lucide-react-native";
import { TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";

function BackToLocationsButton() {
  const router = useRouter();
  return (
    <TouchableOpacity
      onPress={() => router.push("/(tabs)/locations")}
      style={{ marginLeft: 16 }}
    >
      <ArrowLeftIcon size={24} color="#111827" />
    </TouchableOpacity>
  );
}

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
          headerLeft: () => <BackToLocationsButton />,
        }}
      />
    </Stack>
  );
}
