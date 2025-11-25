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
import { useEffect, useState } from "react";
import { Slot, useRouter, useSegments } from "expo-router";
import { AuthProvider, useAuth } from "@/lib/contexts/AuthContext";
import { DataCacheProvider } from "@/lib/contexts/DataCacheContext";
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

  if (!loaded) {
    return null;
  }

  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}

function RootLayoutNav() {
  const [colorMode, setColorMode] = useState<"light" | "dark">("light");
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

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
          <Slot />
        </DataCacheProvider>
      </ThemeProvider>
    </GluestackUIProvider>
  );
}
