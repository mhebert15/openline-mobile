import { Tabs } from "expo-router";
import {
  HomeIcon,
  CalendarIcon,
  MessageCircleIcon,
  SettingsIcon,
  MapPinIcon,
} from "lucide-react-native";
import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { TabAnimationProvider } from "@/components/TabAnimationContext";
import { useDataCache } from "@/lib/contexts/DataCacheContext";
import { useAuth } from "@/lib/contexts/AuthContext";
import React from "react";

function TabsContent() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { prefetchTabData } = useDataCache();

  // Pre-fetch all tab data when user is authenticated
  React.useEffect(() => {
    if (user) {
      // Pre-fetch all tabs in parallel
      Promise.all([
        prefetchTabData("dashboard"),
        prefetchTabData("calendar"),
        prefetchTabData("locations"),
        prefetchTabData("messages"),
      ]).catch((error) => {
        console.error("Error prefetching tab data:", error);
      });
    }
  }, [user, prefetchTabData]);

  // Calculate dynamic tab bar height for icon-only tabs
  // iOS: 48pt + safe area bottom, Android: 48dp
  const tabBarHeight =
    Platform.select({
      ios: 28 + insets.bottom,
      android: 28,
    }) ?? 28;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#2563eb",
        tabBarInactiveTintColor: "#6b7280",
        tabBarStyle: {
          backgroundColor: "#ffffff",
          borderTopColor: "#e5e7eb",
          borderTopWidth: 1,
          height: tabBarHeight,
          paddingBottom: Platform.select({
            ios: insets.bottom > 0 ? insets.bottom : 4,
            android: 4,
          }),
          paddingTop: 8,
          paddingHorizontal: 24,
          paddingVertical: 0,
          justifyContent: "space-around",
          flexDirection: "row",
        },
        tabBarShowLabel: false, // Hide labels since we're icon-only
        tabBarIconStyle: {
          marginTop: 0,
        },
        tabBarItemStyle: {
          flex: 1,
          minWidth: 0,
          justifyContent: "center",
          alignItems: "center",
        },
        headerStyle: {
          backgroundColor: "#ffffff",
        },
        headerTintColor: "#111827",
        headerTitleStyle: {
          fontWeight: "600",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "",
          headerTitle: "Dashboard",
          tabBarIcon: ({ color, size }) => (
            <HomeIcon color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: "Calendar",
          headerTitle: "Calendar",
          tabBarIcon: ({ color, size }) => (
            <CalendarIcon color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="locations"
        options={{
          title: "",
          headerShown: false, // Hide tab header - Stack navigator handles it
          tabBarIcon: ({ color, size }) => (
            <MapPinIcon color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: "",
          headerShown: false, // Hide tab header - Stack navigator handles it
          tabBarIcon: ({ color, size }) => (
            <MessageCircleIcon color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "",
          headerTitle: "Settings",
          tabBarIcon: ({ color, size }) => (
            <SettingsIcon color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}

export default function TabsLayout() {
  return (
    <TabAnimationProvider>
      <TabsContent />
    </TabAnimationProvider>
  );
}
