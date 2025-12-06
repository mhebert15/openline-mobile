import "react-native-gesture-handler";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { GluestackUIProvider } from "@/components/ui/gluestack-ui-provider";
import "@/global.css";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState, useRef } from "react";
import { Slot, useRouter, useSegments } from "expo-router";
import { AuthProvider, useAuth } from "@/lib/contexts/AuthContext";
import { DataCacheProvider } from "@/lib/contexts/DataCacheContext";
import { NotificationProvider } from "@/lib/contexts/NotificationContext";
import {
  registerForPushNotifications,
  savePushToken,
  deletePushToken,
  getDeviceId,
} from "@/lib/services/push-notifications";
import * as Notifications from "expo-notifications";
import { View, ActivityIndicator } from "react-native";

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from "expo-router";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
    ...FontAwesome.font,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {!loaded ? null : (
        <AuthProvider>
          <RootLayoutNav />
        </AuthProvider>
      )}
    </GestureHandlerRootView>
  );
}

function RootLayoutNav() {
  const [colorMode, setColorMode] = useState<"light" | "dark">("light");
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const notificationListener = useRef<Notifications.Subscription | undefined>(
    undefined
  );
  const responseListener = useRef<Notifications.Subscription | undefined>(
    undefined
  );

  // Register for push notifications when user logs in
  useEffect(() => {
    if (!user || loading) return;

    const registerPushToken = async () => {
      try {
        const token = await registerForPushNotifications();
        if (token) {
          const deviceId = await getDeviceId();
          await savePushToken(user.id, token, deviceId);
        }
      } catch (error) {
        console.error("Error registering push token:", error);
      }
    };

    registerPushToken();
  }, [user, loading]);

  // Clean up push token when user logs out
  useEffect(() => {
    if (user) return; // User is logged in, don't clean up

    // User logged out, clean up push token
    const cleanup = async () => {
      // Note: We can't get the user ID here since user is null
      // Token cleanup is handled in AuthContext signOut
    };
    cleanup();
  }, [user]);

  // Handle notification received (foreground/background)
  useEffect(() => {
    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        // Notification received while app is in foreground
        // The notification handler in push-notifications.ts will show it
        console.log("Notification received:", notification);
      });

    // Handle notification tapped
    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data;
        // Navigate based on notification data
        if (data?.screen && data?.id) {
          if (data.screen === "meeting-detail") {
            router.push(`/(tabs)/(dashboard)/meeting-detail?id=${data.id}`);
          } else if (data.screen === "location-detail") {
            router.push(`/(tabs)/locations/location-detail?id=${data.id}`);
          }
        } else {
          // Default: navigate to notifications tab
          router.push("/(tabs)/notifications");
        }
      });

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, [router]);

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === "(auth)";

    // Use setTimeout to avoid navigation loops
    const timeoutId = setTimeout(() => {
      if (!user && !inAuthGroup) {
        // Redirect to sign-in if not authenticated
        router.replace("/(auth)/sign-in");
      } else if (user && inAuthGroup) {
        // Redirect to main app if authenticated
        router.replace("/(tabs)/(dashboard)");
      }
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [user, loading]);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#0086c9" />
      </View>
    );
  }

  return (
    <GluestackUIProvider mode={colorMode}>
      <ThemeProvider value={colorMode === "dark" ? DarkTheme : DefaultTheme}>
        <DataCacheProvider>
          <NotificationProvider profileId={user?.id || null}>
            <Slot />
          </NotificationProvider>
        </DataCacheProvider>
      </ThemeProvider>
    </GluestackUIProvider>
  );
}
