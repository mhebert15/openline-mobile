import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
} from "react";
import { useNavigation, useNavigationState } from "@react-navigation/native";
import { useSegments } from "expo-router";

type TabDirection = "left" | "right" | null;

interface TabAnimationContextType {
  direction: TabDirection;
  currentTabIndex: number;
  tabDirections: Record<string, TabDirection>;
  TAB_ORDER: Record<string, number>;
}

// Tab order mapping for direction detection
export const TAB_ORDER: Record<string, number> = {
  "(dashboard)": 0,
  calendar: 1,
  locations: 2,
  messages: 3,
  notifications: 4,
  settings: 5,
};

type TabRouteKey = keyof typeof TAB_ORDER;

function isTabRouteKey(value: string): value is TabRouteKey {
  return Object.prototype.hasOwnProperty.call(TAB_ORDER, value);
}

const TabAnimationContextDefault: TabAnimationContextType = {
  direction: null,
  currentTabIndex: 0,
  tabDirections: {},
  TAB_ORDER,
};

const TabAnimationContext = createContext<TabAnimationContextType>(
  TabAnimationContextDefault
);

export function TabAnimationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const navigation = useNavigation();
  const segments = useSegments();
  const rawSegments = segments as unknown as string[];
  const [direction, setDirection] = useState<TabDirection>(null);
  const [currentTabIndex, setCurrentTabIndex] = useState(0);
  const [tabDirections, setTabDirections] = useState<
    Record<string, TabDirection>
  >({});
  const previousTabIndexRef = useRef<number | null>(null);

  // Get current tab route name from segments
  // segments will be like ["(tabs)", "index"] or ["(tabs)", "locations", "index"]
  // We want the segment after "(tabs)" which is the tab name
  let currentTabRouteName: TabRouteKey | null = null;
  if (rawSegments.length > 0 && rawSegments[0] === "(tabs)") {
    for (let i = 1; i < rawSegments.length; i += 1) {
      const candidate = rawSegments[i];
      if (candidate && isTabRouteKey(candidate)) {
        currentTabRouteName = candidate;
        break;
      }
    }

    if (!currentTabRouteName) {
      currentTabRouteName = "(dashboard)";
    }
  }

  useEffect(() => {
    if (!currentTabRouteName) return;

    const currentIndex = TAB_ORDER[currentTabRouteName];

    // Skip if not a valid tab
    if (currentIndex === undefined) return;

    // Initialize on first mount
    if (previousTabIndexRef.current === null) {
      previousTabIndexRef.current = currentIndex;
      setCurrentTabIndex(currentIndex);
      setTabDirections({ [currentTabRouteName]: null });
      return;
    }

    // Check if tab changed
    if (currentIndex !== previousTabIndexRef.current) {
      const newDirection: TabDirection =
        currentIndex > previousTabIndexRef.current ? "right" : "left";

      setDirection(newDirection);
      setCurrentTabIndex(currentIndex);

      // Update tabDirections - set direction for current tab IMMEDIATELY
      // This ensures the direction is available when the new screen mounts
      setTabDirections((prev) => {
        const updated = {
          ...prev,
          [currentTabRouteName]: newDirection,
        };
        return updated;
      });

      previousTabIndexRef.current = currentIndex;
    } else {
      // If tab didn't change but we're on this tab, ensure direction is preserved
      // This handles cases where the component remounts but tab hasn't changed
      setTabDirections((prev) => {
        // If direction already exists for this tab, keep it
        if (prev[currentTabRouteName] !== undefined) {
          return prev;
        }
        // Otherwise, set to null (no animation needed)
        return {
          ...prev,
          [currentTabRouteName]: null,
        };
      });
    }
  }, [currentTabRouteName]);

  return (
    <TabAnimationContext.Provider
      value={{ direction, currentTabIndex, tabDirections, TAB_ORDER }}
    >
      {children}
    </TabAnimationContext.Provider>
  );
}

export function useTabAnimation() {
  return useContext(TabAnimationContext);
}
