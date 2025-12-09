import { useRouter, useSegments } from "expo-router";
import {
  NativeTabs,
  Icon,
  Label,
  Badge,
} from "expo-router/unstable-native-tabs";
import {
  SendIcon,
  HomeIcon,
  MessageCircleIcon,
  SettingsIcon,
  MapPinIcon,
  BellIcon,
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
import { useNotifications } from "@/lib/contexts/NotificationContext";
import { supabase } from "@/lib/supabase/client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import type {
  User,
  Message,
  Profile,
  Location,
} from "@/lib/types/database.types";
import { ComposeSheetProvider } from "@/lib/contexts/ComposeSheetContext";

const TAB_ROUTE_MAP: Record<string, string> = {
  dashboard: "/(tabs)/(dashboard)",
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
  const { user } = useAuth();
  // Get unread count from NotificationContext (will be 0 if context not available)
  let unreadCount = 0;
  try {
    const notifications = useNotifications();
    unreadCount = notifications.unreadCount;
  } catch {
    // Context not available yet, will be 0
  }
  const tabBarHeight =
    Platform.select({
      ios: 48 + insets.bottom,
      android: 48,
    }) ?? 48;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const sheetTranslateY = useRef(new Animated.Value(0)).current;
  const sheetHeight = Dimensions.get("window").height * 0.9;
  const { cache, prefetchTabData } = useDataCache();

  // Track unread message count
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [messageReads, setMessageReads] = useState<Set<string>>(new Set());

  // Fetch unread message count from Supabase
  useEffect(() => {
    if (!user) {
      setUnreadMessageCount(0);
      setMessageReads(new Set());
      return;
    }

    const fetchUnreadCount = async () => {
      try {
        // Get all messages for the current user
        const messages = (cache.messages.messages.data as any[]) || [];
        if (messages.length === 0) {
          setUnreadMessageCount(0);
          return;
        }

        const messageIds = messages.map((msg) => msg.id);
        if (messageIds.length === 0) {
          setUnreadMessageCount(0);
          return;
        }

        // Fetch read status for all messages
        const { data: readsData } = await supabase
          .from("message_reads")
          .select("message_id")
          .eq("profile_id", user.id)
          .in("message_id", messageIds);

        const readSet = new Set(
          (readsData || []).map((read: any) => read.message_id)
        );
        setMessageReads(readSet);

        // Count unread messages (not sent by current user, not in messageReads)
        const unreadCount = messages.filter(
          (msg) => msg.sender_profile_id !== user.id && !readSet.has(msg.id)
        ).length;

        setUnreadMessageCount(unreadCount);
      } catch (error) {
        console.error("Error fetching unread message count:", error);
      }
    };

    fetchUnreadCount();

    // Subscribe to real-time updates for messages and message_reads
    const messagesChannel = supabase
      .channel(`messages:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
          filter: `recipient_profile_id=eq.${user.id}`,
        },
        () => {
          // Refetch when messages change
          fetchUnreadCount();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "message_reads",
          filter: `profile_id=eq.${user.id}`,
        },
        () => {
          // Refetch when read status changes
          fetchUnreadCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messagesChannel);
    };
  }, [user, cache.messages.messages.data]);

  const [showComposeSheet, setShowComposeSheet] = useState(false);
  const [recipientQuery, setRecipientQuery] = useState("");
  const [selectedRecipient, setSelectedRecipient] = useState<User | null>(null);
  const [composeBody, setComposeBody] = useState("");
  const [composeSending, setComposeSending] = useState(false);
  const [availableRecipientsData, setAvailableRecipientsData] = useState<
    Array<Profile & { location?: Location; location_id?: string }>
  >([]);
  const [loadingRecipients, setLoadingRecipients] = useState(false);

  // Fetch available recipients from Supabase
  const fetchAvailableRecipients = async () => {
    if (!user) {
      setAvailableRecipientsData([]);
      return;
    }

    setLoadingRecipients(true);
    try {
      // Step 1: Get medical rep's accessible location IDs
      const { data: medicalRep, error: medicalRepError } = await supabase
        .from("medical_reps")
        .select("id")
        .eq("profile_id", user.id)
        .eq("status", "active")
        .maybeSingle();

      if (medicalRepError) {
        console.error("Error fetching medical rep:", medicalRepError);
        setAvailableRecipientsData([]);
        setLoadingRecipients(false);
        return;
      }

      let accessibleLocationIds: string[] = [];

      if (medicalRep) {
        const medicalRepId = (medicalRep as { id: string }).id;
        const { data: repLocations, error: repLocError } = await supabase
          .from("medical_rep_locations")
          .select("location_id")
          .eq("medical_rep_id", medicalRepId)
          .eq("relationship_status", "active");

        if (repLocError) {
          console.error("Error fetching medical rep locations:", repLocError);
          setAvailableRecipientsData([]);
          setLoadingRecipients(false);
          return;
        }

        accessibleLocationIds = (repLocations || []).map(
          (rl: any) => rl.location_id
        );
      } else if (user.user_type === "admin") {
        // Admin can see all locations - fetch all active locations
        const { data: allLocations, error: locationsError } = await supabase
          .from("locations")
          .select("id")
          .eq("status", "active")
          .is("deleted_at", null);

        if (locationsError) {
          console.error("Error fetching locations:", locationsError);
        } else {
          accessibleLocationIds = (allLocations || []).map(
            (loc: any) => loc.id
          );
        }
      }

      if (accessibleLocationIds.length === 0) {
        setAvailableRecipientsData([]);
        setLoadingRecipients(false);
        return;
      }

      // Step 2: Fetch profiles that are office_staff or location admins at accessible locations
      // First, get all location admins for accessible locations
      const { data: locationAdmins, error: adminsError } = await supabase
        .from("user_roles")
        .select("profile_id, location_id")
        .in("location_id", accessibleLocationIds)
        .eq("role", "location_admin")
        .eq("status", "active");

      if (adminsError) {
        console.error("Error fetching location admins:", adminsError);
      }

      const adminProfileIds = new Set(
        (locationAdmins || []).map((admin: any) => admin.profile_id)
      );
      const adminLocationMap = new Map<string, string>();
      (locationAdmins || []).forEach((admin: any) => {
        adminLocationMap.set(admin.profile_id, admin.location_id);
      });

      // Step 3: Fetch profiles that are office_staff with default_location_id in accessible locations
      // OR profiles that are location admins
      const profileIdsToFetch = Array.from(adminProfileIds);

      // Query for office_staff with default_location_id in accessible locations
      const { data: officeStaffProfiles, error: staffError } = await supabase
        .from("profiles")
        .select(
          "id, full_name, email, phone, user_type, default_location_id, status"
        )
        .eq("user_type", "office_staff")
        .eq("status", "active")
        .in("default_location_id", accessibleLocationIds)
        .neq("id", user.id);

      if (staffError) {
        console.error("Error fetching office staff:", staffError);
      }

      // Query for location admin profiles
      let adminProfiles: any[] = [];
      if (profileIdsToFetch.length > 0) {
        const { data: adminProfilesData, error: adminProfilesError } =
          await supabase
            .from("profiles")
            .select(
              "id, full_name, email, phone, user_type, default_location_id, status"
            )
            .in("id", profileIdsToFetch)
            .eq("status", "active")
            .neq("id", user.id);

        if (adminProfilesError) {
          console.error("Error fetching admin profiles:", adminProfilesError);
        } else {
          adminProfiles = adminProfilesData || [];
        }
      }

      // Combine and deduplicate profiles
      const allProfiles = [
        ...(officeStaffProfiles || []),
        ...adminProfiles,
      ].filter(
        (profile, index, self) =>
          index === self.findIndex((p) => p.id === profile.id)
      );

      // Fetch location information for each profile
      const recipientsWithLocations = await Promise.all(
        allProfiles.map(async (profile) => {
          let locationId: string | undefined;
          let location: Location | undefined;

          // Determine location_id: use adminLocationMap for admins, or default_location_id for staff
          if (adminLocationMap.has(profile.id)) {
            locationId = adminLocationMap.get(profile.id);
          } else {
            locationId = profile.default_location_id || undefined;
          }

          // Fetch location details if we have a location_id
          if (locationId) {
            const { data: locationData, error: locationError } = await supabase
              .from("locations")
              .select(
                "id, name, address_line1, address_line2, city, state, postal_code, phone"
              )
              .eq("id", locationId)
              .maybeSingle();

            if (!locationError && locationData) {
              location = locationData as Location;
            }
          }

          return {
            ...profile,
            location,
            location_id: locationId,
          };
        })
      );

      setAvailableRecipientsData(recipientsWithLocations);
    } catch (error) {
      console.error("Error fetching available recipients:", error);
      setAvailableRecipientsData([]);
    } finally {
      setLoadingRecipients(false);
    }
  };

  const existingParticipantIds = useMemo(() => {
    const ids = new Set<string>();
    const cachedMessages = (cache.messages.messages.data as Message[]) || [];
    cachedMessages.forEach((message) => {
      if (message.sender_profile_id && message.sender_profile_id !== user?.id) {
        ids.add(message.sender_profile_id);
      }
      if (
        message.recipient_profile_id &&
        message.recipient_profile_id !== user?.id
      ) {
        ids.add(message.recipient_profile_id);
      }
    });
    return ids;
  }, [cache.messages.messages.data, user?.id]);

  // Fetch recipients when compose sheet opens
  useEffect(() => {
    if (showComposeSheet && user) {
      fetchAvailableRecipients();
    }
  }, [showComposeSheet, user]);

  const availableRecipients = useMemo(() => {
    const query = recipientQuery.trim().toLowerCase();
    return availableRecipientsData.filter((recipient) => {
      // Exclude existing participants
      if (existingParticipantIds.has(recipient.id)) {
        return false;
      }
      // Filter by search query if provided
      if (!query) return true;
      return (
        recipient.full_name.toLowerCase().includes(query) ||
        recipient.email.toLowerCase().includes(query)
      );
    });
  }, [recipientQuery, existingParticipantIds, availableRecipientsData]);

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
    if (!selectedRecipient || !trimmedBody || !user) {
      return;
    }

    // Get location_id from the recipient data
    const recipientData = availableRecipientsData.find(
      (r) => r.id === selectedRecipient.id
    );
    const locationId = recipientData?.location_id;

    if (!locationId) {
      console.error(
        "No location found for selected recipient",
        selectedRecipient.id
      );
      return;
    }

    setComposeSending(true);
    try {
      // Insert message into Supabase
      // Always use "direct" message_type when sending to a specific recipient
      const { error: insertError } = await supabase.from("messages").insert({
        location_id: locationId,
        sender_profile_id: user.id,
        recipient_profile_id: selectedRecipient.id,
        body: trimmedBody,
        sent_at: new Date().toISOString(),
        message_type: "direct",
      } as any);

      if (insertError) {
        console.error("Error sending message:", insertError);
        return;
      }

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
        <NativeTabs>
          <NativeTabs.Trigger name="(dashboard)">
            <Label hidden={true}>Home</Label>
            <Icon
              src={{
                default: require("@/assets/icons/home-default.png"),
                selected: require("@/assets/icons/home-selected.png"),
              }}
            />
          </NativeTabs.Trigger>
          <NativeTabs.Trigger name="locations">
            <Label hidden={true}>Locations</Label>
            <Icon
              src={{
                default: require("@/assets/icons/locations-default.png"),
                selected: require("@/assets/icons/locations-selected.png"),
              }}
            />
          </NativeTabs.Trigger>
          <NativeTabs.Trigger name="messages">
            <Label hidden={true}>Messages</Label>
            <Icon
              src={{
                default: require("@/assets/icons/messages-default.png"),
                selected: require("@/assets/icons/messages-selected.png"),
              }}
            />
            {unreadMessageCount > 0 && (
              <Badge>
                {unreadMessageCount > 99
                  ? "99+"
                  : unreadMessageCount.toString()}
              </Badge>
            )}
          </NativeTabs.Trigger>
          <NativeTabs.Trigger name="notifications">
            <Label hidden={true}>Notifications</Label>
            <Icon
              src={{
                default: require("@/assets/icons/notifications-default.png"),
                selected: require("@/assets/icons/notifications-selected.png"),
              }}
            />
            {unreadCount > 0 && (
              <Badge>{unreadCount > 99 ? "99+" : unreadCount.toString()}</Badge>
            )}
          </NativeTabs.Trigger>
          <NativeTabs.Trigger name="settings">
            <Label hidden={true}>Settings</Label>
            <Icon
              src={{
                default: require("@/assets/icons/settings-default.png"),
                selected: require("@/assets/icons/settings-selected.png"),
              }}
            />
          </NativeTabs.Trigger>
        </NativeTabs>
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
                className="border border-gray-200 rounded-md px-4 py-4 flex-row items-center"
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
              {loadingRecipients ? (
                <View className="py-8 items-center">
                  <ActivityIndicator size="small" color="#0086c9" />
                  <Text className="text-gray-500 mt-2">
                    Loading recipients...
                  </Text>
                </View>
              ) : availableRecipients.length === 0 ? (
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
                  className="flex-1 text-base text-gray-900 flex-row items-center justify-center mr-2"
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
