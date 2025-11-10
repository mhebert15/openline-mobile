import { Tabs, useRouter, useSegments } from "expo-router";
import {
  HomeIcon,
  CalendarIcon,
  MessageCircleIcon,
  SettingsIcon,
  MapPinIcon,
  BellIcon,
  SendIcon,
} from "lucide-react-native";
import {
  Platform,
  Pressable,
  type PressableProps,
  Animated,
  Dimensions,
  Modal,
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { TabAnimationProvider } from "@/components/TabAnimationContext";
import { useDataCache } from "@/lib/contexts/DataCacheContext";
import { useAuth } from "@/lib/contexts/AuthContext";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { mockAdminUsers, mockOffices } from "@/lib/mock/data";
import type { User, Message } from "@/lib/types/database.types";
import { mockMessagesService } from "@/lib/mock/services";
import { ComposeSheetProvider } from "./composeSheetContext";

const TAB_ROUTE_MAP: Record<string, string> = {
  index: "/(tabs)",
  calendar: "/(tabs)/calendar",
  locations: "/(tabs)/locations",
  messages: "/(tabs)/messages",
  notifications: "/(tabs)/notifications",
  settings: "/(tabs)/settings",
};

type TabButtonProps = PressableProps & {
  tabRouteSegment?: keyof typeof TAB_ROUTE_MAP;
  accessibilityState?: { selected?: boolean };
};

const LargeHitTabButton: React.FC<TabButtonProps> = ({
  tabRouteSegment,
  accessibilityState,
  onPress,
  style,
  ...rest
}) => {
  const router = useRouter();
  const segments = useSegments();

  const handlePress: PressableProps["onPress"] = (event) => {
    if (tabRouteSegment && accessibilityState?.selected) {
      const route = TAB_ROUTE_MAP[tabRouteSegment];
      if (route) {
        router.replace(route as any);
        return;
      }
    }

    onPress?.(event);
  };

  let resolvedStyle: PressableProps["style"];
  if (typeof style === "function") {
    resolvedStyle = (state) => [
      style(state),
      { paddingHorizontal: 12, paddingVertical: 8 },
    ];
  } else {
    resolvedStyle = [style, { paddingHorizontal: 12, paddingVertical: 8 }];
  }

  return (
    <Pressable
      {...rest}
      onPress={handlePress}
      style={resolvedStyle}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    />
  );
};

function TabsContent() {
  const insets = useSafeAreaInsets();
  const tabBarHeight =
    Platform.select({
      ios: 48 + insets.bottom,
      android: 48,
    }) ?? 48;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const sheetTranslateY = useRef(new Animated.Value(0)).current;
  const sheetHeight = Dimensions.get("window").height * 0.9;
  const { user } = useAuth();
  const { cache, prefetchTabData } = useDataCache();
  const [showComposeSheet, setShowComposeSheet] = useState(false);
  const [recipientQuery, setRecipientQuery] = useState("");
  const [selectedRecipient, setSelectedRecipient] = useState<User | null>(null);
  const [composeBody, setComposeBody] = useState("");
  const [composeSending, setComposeSending] = useState(false);

  const adminOfficeMap = useMemo(() => {
    const map = new Map<string, { id: string; name: string }>();
    mockOffices.forEach((office) => {
      if (office.admin_user_id) {
        map.set(office.admin_user_id, { id: office.id, name: office.name });
      }
    });
    return map;
  }, []);

  const existingParticipantIds = useMemo(() => {
    const ids = new Set<string>();
    const cachedMessages = (cache.messages.messages.data as Message[]) || [];
    cachedMessages.forEach((message) => {
      message.participant_ids.forEach((id) => {
        if (id !== user?.id) {
          ids.add(id);
        }
      });
    });
    return ids;
  }, [cache.messages.messages.data, user?.id]);

  const availableRecipients = useMemo(() => {
    const query = recipientQuery.trim().toLowerCase();
    return mockAdminUsers.filter((admin) => {
      if (existingParticipantIds.has(admin.id)) {
        return false;
      }
      if (!query) return true;
      return (
        admin.full_name.toLowerCase().includes(query) ||
        admin.email.toLowerCase().includes(query)
      );
    });
  }, [recipientQuery, existingParticipantIds]);

  const openComposeSheet = () => {
    setRecipientQuery("");
    setSelectedRecipient(null);
    setComposeBody("");
    setShowComposeSheet(true);
    sheetTranslateY.setValue(sheetHeight);
    overlayOpacity.setValue(0);
    Animated.parallel([
      Animated.timing(overlayOpacity, {
        toValue: 0.45,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(sheetTranslateY, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeComposeSheet = () => {
    Animated.parallel([
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(sheetTranslateY, {
        toValue: sheetHeight,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowComposeSheet(false);
      setSelectedRecipient(null);
      setRecipientQuery("");
      setComposeBody("");
      setComposeSending(false);
    });
  };

  const handleRecipientSelect = (recipient: User) => {
    setSelectedRecipient(recipient);
    setRecipientQuery(recipient.full_name);
  };

  const handleComposeSend = async () => {
    const trimmedBody = composeBody.trim();
    if (!selectedRecipient || !trimmedBody) {
      return;
    }

    const officeInfo = adminOfficeMap.get(selectedRecipient.id);
    if (!officeInfo) {
      console.error(
        "No office found for selected recipient",
        selectedRecipient.id
      );
      return;
    }

    setComposeSending(true);
    try {
      await mockMessagesService.sendMessage(
        selectedRecipient.id,
        officeInfo.id,
        "New Conversation",
        trimmedBody
      );
      closeComposeSheet();
      prefetchTabData("messages").catch((error) =>
        console.error("Error refreshing messages after compose:", error)
      );
    } catch (error) {
      console.error("Error sending new message:", error);
    } finally {
      setComposeSending(false);
    }
  };

  const hasPrefetchedRef = useRef(false);

  useEffect(() => {
    if (!user?.id) {
      hasPrefetchedRef.current = false;
      return;
    }

    if (hasPrefetchedRef.current) {
      return;
    }

    hasPrefetchedRef.current = true;
    const tabsToPrefetch: Parameters<typeof prefetchTabData>[0][] = [
      "dashboard",
      "calendar",
      "locations",
      "messages",
    ];

    tabsToPrefetch.forEach((tab) => {
      prefetchTabData(tab).catch((error) =>
        console.error(`Error prefetching ${tab} data:`, error)
      );
    });
  }, [user?.id, prefetchTabData]);

  return (
    <ComposeSheetProvider value={{ openComposeSheet }}>
      <View className="flex-1">
        <Tabs
          screenOptions={{
            tabBarActiveTintColor: "#0086c9",
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
              headerShown: false, // Hide navigation header
              tabBarButton: (props) => <LargeHitTabButton {...props} />,
              tabBarIcon: ({ color, size }) => (
                <HomeIcon color={color} size={size} />
              ),
            }}
          />
          <Tabs.Screen
            name="calendar"
            options={{
              title: "",
              headerShown: false,
              tabBarButton: (props) => <LargeHitTabButton {...props} />,
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
              tabBarButton: (props) => (
                <LargeHitTabButton {...props} tabRouteSegment="locations" />
              ),
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
              tabBarButton: (props) => (
                <LargeHitTabButton {...props} tabRouteSegment="messages" />
              ),
              tabBarIcon: ({ color, size }) => (
                <MessageCircleIcon color={color} size={size} />
              ),
            }}
          />
          <Tabs.Screen
            name="notifications"
            options={{
              title: "",
              headerShown: false,
              tabBarButton: (props) => (
                <LargeHitTabButton {...props} tabRouteSegment="notifications" />
              ),
              tabBarIcon: ({ color, size }) => (
                <BellIcon color={color} size={size} />
              ),
            }}
          />
          <Tabs.Screen
            name="settings"
            options={{
              title: "",
              headerShown: false,
              tabBarButton: (props) => <LargeHitTabButton {...props} />,
              tabBarIcon: ({ color, size }) => (
                <SettingsIcon color={color} size={size} />
              ),
            }}
          />
        </Tabs>
      </View>

      <Modal
        transparent
        animationType="none"
        visible={showComposeSheet}
        onRequestClose={closeComposeSheet}
      >
        <View style={{ flex: 1, justifyContent: "flex-end" }}>
          <Animated.View
            style={[
              {
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "rgba(0,0,0,0.3)",
              },
              { opacity: overlayOpacity },
            ]}
          >
            <TouchableOpacity
              style={{ flex: 1 }}
              activeOpacity={1}
              onPress={closeComposeSheet}
            />
          </Animated.View>

          <Animated.View
            style={{
              height: sheetHeight,
              backgroundColor: "#fff",
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              transform: [{ translateY: sheetTranslateY }],
              paddingBottom: 24,
            }}
          >
            <View className="p-4 border-b border-gray-200 flex-row items-center justify-between">
              <View style={{ width: 24 }} />
              <Text className="text-lg font-semibold text-gray-900">
                New Message
              </Text>
              <TouchableOpacity onPress={closeComposeSheet}>
                <Text className="text-gray-500 text-xl">✕</Text>
              </TouchableOpacity>
            </View>
            <View className="px-4 pt-4">
              <TextInput
                className="border border-gray-300 rounded-lg px-4 py-3 text-base"
                placeholder="To: start typing a name or email"
                value={recipientQuery}
                onChangeText={(value) => {
                  setRecipientQuery(value);
                  setSelectedRecipient(null);
                }}
                autoFocus
              />
              {selectedRecipient && (
                <Text className="text-sm text-gray-500 mt-2">
                  Selected: {selectedRecipient.full_name}
                </Text>
              )}
            </View>

            <ScrollView
              className="px-4 py-3"
              keyboardShouldPersistTaps="handled"
            >
              {availableRecipients.length === 0 ? (
                <Text className="text-gray-500 text-center">
                  No recipients available.
                </Text>
              ) : (
                availableRecipients.map((recipient) => (
                  <TouchableOpacity
                    key={recipient.id}
                    className={`flex-row items-center justify-between py-3 border-b border-gray-100 rounded-lg px-2 ${
                      selectedRecipient?.id === recipient.id ? "bg-blue-50" : ""
                    }`}
                    onPress={() => handleRecipientSelect(recipient)}
                  >
                    <View className="flex-1">
                      <Text className="text-gray-900 font-medium">
                        {recipient.full_name}
                      </Text>
                      <Text className="text-gray-500 text-sm">
                        {recipient.email}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>

            <View className="px-4 pb-6">
              <View className="bg-white border border-gray-200 rounded-full px-4 py-2 flex-row items-center">
                <TextInput
                  className="flex-1 text-base text-gray-900 mr-2"
                  placeholder="Type a message..."
                  placeholderTextColor="#9ca3af"
                  value={composeBody}
                  onChangeText={setComposeBody}
                  multiline
                  style={{ maxHeight: 120 }}
                />
                <TouchableOpacity
                  className={`w-10 h-10 rounded-full items-center justify-center ${
                    composeBody.trim() && selectedRecipient
                      ? "bg-[#0086c9]"
                      : "bg-gray-300"
                  }`}
                  disabled={
                    !composeBody.trim() || !selectedRecipient || composeSending
                  }
                  onPress={handleComposeSend}
                >
                  {composeSending ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <SendIcon
                      size={18}
                      color="white"
                      style={{ transform: [{ rotate: "45deg" }] }}
                    />
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </ComposeSheetProvider>
  );
}

export default function TabsLayout() {
  return (
    <TabAnimationProvider>
      <TabsContent />
    </TabAnimationProvider>
  );
}
