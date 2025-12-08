import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { supabase } from "@/lib/supabase/client";
import * as Device from "expo-device";
import { isDevelopmentBuild } from "@/lib/utils/environment";

// Configure how notifications are handled when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Request notification permissions and get Expo push token
 * Note: Push notifications are only available in development builds, not Expo Go
 */
export async function registerForPushNotifications(): Promise<
  string | null
> {
  // Check if running in development build (not Expo Go)
  if (!isDevelopmentBuild()) {
    console.log(
      "Push notifications are not available in Expo Go. Please use a development build to test push notifications."
    );
    return null;
  }

  let token: string | null = null;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.log("Failed to get push token for push notification!");
      return null;
    }

    try {
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
      });
      token = tokenData.data;
    } catch (error) {
      console.error("Error getting Expo push token:", error);
      return null;
    }
  } else {
    console.log("Must use physical device for Push Notifications");
  }

  return token;
}

/**
 * Save push token to database
 */
export async function savePushToken(
  profileId: string,
  token: string,
  deviceId?: string
): Promise<void> {
  // Check if token already exists
  const { data: existingToken } = await supabase
    .from("user_push_tokens")
    .select("id")
    .eq("expo_push_token", token)
    .maybeSingle();

  if (existingToken) {
    const tokenId = (existingToken as { id: string }).id;
    // Update existing token
    const { error } = await supabase
      .from("user_push_tokens")
      .update({
        profile_id: profileId,
        device_id: deviceId || null,
        updated_at: new Date().toISOString(),
      } as never)
      .eq("id", tokenId);

    if (error) {
      console.error("Error updating push token:", error);
      throw error;
    }
  } else {
    // Insert new token
    const { error } = await supabase.from("user_push_tokens").insert({
      profile_id: profileId,
      expo_push_token: token,
      device_id: deviceId || null,
    } as never);

    if (error) {
      console.error("Error saving push token:", error);
      throw error;
    }
  }
}

/**
 * Delete push token from database (on logout)
 */
export async function deletePushToken(profileId: string): Promise<void> {
  const { error } = await supabase
    .from("user_push_tokens")
    .delete()
    .eq("profile_id", profileId);

  if (error) {
    console.error("Error deleting push token:", error);
    throw error;
  }
}

/**
 * Get device ID (for tracking multiple devices per user)
 */
export async function getDeviceId(): Promise<string | undefined> {
  if (Platform.OS === "ios") {
    // On iOS, we can use a combination of device info
    return Device.modelName || undefined;
  } else if (Platform.OS === "android") {
    // On Android, we can use device model
    return Device.modelName || undefined;
  }
  return undefined;
}

