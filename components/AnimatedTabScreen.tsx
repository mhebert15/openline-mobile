import React, { useEffect, useLayoutEffect } from "react";
import { Dimensions, StyleSheet } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { useTabAnimation } from "@/components/TabAnimationContext";

type TabDirection = "left" | "right" | null;
import { useRoute, useFocusEffect } from "@react-navigation/native";
import { useSegments } from "expo-router";
import { useCallback } from "react";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface AnimatedTabScreenProps {
  children: React.ReactNode;
}

export function AnimatedTabScreen({ children }: AnimatedTabScreenProps) {
  const route = useRoute();
  const segments = useSegments();
  const { tabDirections, TAB_ORDER } = useTabAnimation();

  // Get the actual tab route name - for nested routes, get the parent route name
  // For locations/index.tsx, we want "locations", not "index"
  // For dashboard (index.tsx), route.name is "index"
  let routeName = route.name;

  // Use segments to find the tab route name
  // segments will be like ["(tabs)", "locations", "index"] or ["(tabs)", "index"]
  // We want the segment after "(tabs)"
  if (segments.length >= 2 && segments[0] === "(tabs)") {
    const tabSegment = segments[1];
    // If tabSegment is in TAB_ORDER, use it (this handles locations, messages, etc.)
    // For dashboard, segments[1] will be "index" which matches TAB_ORDER
    if (tabSegment && TAB_ORDER[tabSegment] !== undefined) {
      routeName = tabSegment;
    } else if (routeName === "index" && TAB_ORDER["index"] !== undefined) {
      // Ensure "index" route is correctly identified for dashboard
      routeName = "index";
    }
  } else if (routeName === "index" && TAB_ORDER["index"] !== undefined) {
    // Fallback: ensure "index" is used for dashboard
    routeName = "index";
  }

  const translateX = useSharedValue(0);
  const directionRef = React.useRef<"left" | "right" | null>(null);
  const previousRouteNameRef = React.useRef<string | null>(null);
  const isInitialMountRef = React.useRef(true);
  const hasAnimatedForRouteRef = React.useRef<string | null>(null);
  const previousFocusedDirectionRef = React.useRef<TabDirection>(null);

  const direction = tabDirections[routeName] || null;

  // Use useFocusEffect to detect when this tab becomes focused
  // This handles the case where the tab is already mounted but becomes active again
  useFocusEffect(
    useCallback(() => {
      // When tab becomes focused, check if we should animate
      // Reset animation state if direction changed since last focus
      const currentDirection = tabDirections[routeName] || null;

      // If this is the first focus, reset animation state to allow animation
      // Don't mark as animated yet - let the animation logic handle it
      if (previousFocusedDirectionRef.current === null) {
        previousFocusedDirectionRef.current = currentDirection;
        // Reset animation state so animation can trigger
        hasAnimatedForRouteRef.current = null;
        directionRef.current = null;
        return;
      }

      // If direction changed since last time this tab was focused, reset animation state
      if (
        currentDirection &&
        currentDirection !== previousFocusedDirectionRef.current
      ) {
        // Direction changed - reset animation state to allow re-animation
        hasAnimatedForRouteRef.current = null;
        directionRef.current = null;
        previousFocusedDirectionRef.current = currentDirection;
      } else if (
        currentDirection &&
        currentDirection === previousFocusedDirectionRef.current
      ) {
        // Same direction as last focus - still reset to allow re-animation on refocus
        // This ensures animation works every time you navigate to the tab
        hasAnimatedForRouteRef.current = null;
        directionRef.current = null;
      }
    }, [routeName, tabDirections])
  );

  // Use useLayoutEffect for initial mount to catch direction synchronously
  useLayoutEffect(() => {
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      previousRouteNameRef.current = routeName;

      // On initial mount, check if direction is already set
      // This handles the case where we're navigating TO this screen
      const currentDirection = tabDirections[routeName] || null;

      if (currentDirection) {
        // We have a direction on mount - this is a navigation TO this screen
        hasAnimatedForRouteRef.current = routeName;
        directionRef.current = currentDirection;

        if (currentDirection === "right") {
          translateX.value = SCREEN_WIDTH;
          translateX.value = withTiming(0, {
            duration: 250,
            easing: Easing.out(Easing.cubic),
          });
        } else if (currentDirection === "left") {
          translateX.value = -SCREEN_WIDTH;
          translateX.value = withTiming(0, {
            duration: 250,
            easing: Easing.out(Easing.cubic),
          });
        }
      } else {
        // No direction on mount - this might be the starting screen
        // OR direction hasn't been set yet (race condition)
        translateX.value = 0;
        directionRef.current = null;
      }
    }
  }, [routeName, tabDirections]); // Include deps so we re-check if direction becomes available

  // Also watch for direction becoming available after mount
  useEffect(() => {
    // Only handle if we just mounted and direction wasn't available, but now it is
    if (
      !isInitialMountRef.current &&
      direction &&
      directionRef.current === null &&
      hasAnimatedForRouteRef.current !== routeName
    ) {
      hasAnimatedForRouteRef.current = routeName;
      directionRef.current = direction;

      if (direction === "right") {
        translateX.value = SCREEN_WIDTH;
        translateX.value = withTiming(0, {
          duration: 250,
          easing: Easing.out(Easing.cubic),
        });
      } else if (direction === "left") {
        translateX.value = -SCREEN_WIDTH;
        translateX.value = withTiming(0, {
          duration: 250,
          easing: Easing.out(Easing.cubic),
        });
      }
    }
  }, [direction, routeName, translateX]);

  useEffect(() => {
    // Skip if still initial mount (handled by useLayoutEffect)
    if (isInitialMountRef.current) {
      return;
    }

    // Check if route changed
    const routeChanged = previousRouteNameRef.current !== routeName;

    // If route changed, reset the animation flag for the new route
    if (routeChanged) {
      hasAnimatedForRouteRef.current = null;
      previousRouteNameRef.current = routeName;
    }

    // Animate if we have a direction and:
    // 1. We haven't animated for this route yet (hasAnimatedForRouteRef was reset by useFocusEffect), OR
    // 2. Direction changed from what we last animated
    const shouldAnimate =
      direction &&
      (hasAnimatedForRouteRef.current !== routeName ||
        direction !== directionRef.current);

    if (shouldAnimate) {
      hasAnimatedForRouteRef.current = routeName;
      directionRef.current = direction;

      if (direction === "right") {
        // Coming from right: start at screen width, animate to 0
        translateX.value = SCREEN_WIDTH;
        translateX.value = withTiming(0, {
          duration: 250,
          easing: Easing.out(Easing.cubic),
        });
      } else if (direction === "left") {
        // Coming from left: start at -screen width, animate to 0
        translateX.value = -SCREEN_WIDTH;
        translateX.value = withTiming(0, {
          duration: 250,
          easing: Easing.out(Easing.cubic),
        });
      }
    } else if (direction === null && directionRef.current !== null) {
      // Reset direction ref when direction becomes null
      directionRef.current = null;
      translateX.value = 0;
    }
  }, [direction, routeName, translateX, tabDirections]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
