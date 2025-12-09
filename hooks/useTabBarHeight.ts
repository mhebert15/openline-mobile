import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/**
 * Hook to get the tab bar height accounting for safe area insets
 * @returns The height of the tab bar in pixels
 */
export function useTabBarHeight(): number {
  const insets = useSafeAreaInsets();
  return Platform.select({
    ios: 48 + insets.bottom,
    android: 48,
  }) ?? 48;
}

