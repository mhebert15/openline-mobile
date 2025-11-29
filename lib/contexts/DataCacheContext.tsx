import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
} from "react";
import { useAuth } from "./AuthContext";
import { supabase } from "../supabase/client";
import { mockMeetingsService, mockOfficesService } from "@/lib/mock/services";
import type {
  Meeting,
  MedicalOffice,
  Message,
  Location,
  Profile,
} from "@/lib/types/database.types";

// Cache entry structure
interface CacheEntry<T> {
  data: T | null;
  timestamp: number;
  loading: boolean;
}

// Cache data structure
interface CacheData {
  dashboard: {
    upcomingMeetings: CacheEntry<Meeting[]>;
    completedCount: CacheEntry<number>;
  };
  calendar: {
    meetings: CacheEntry<Meeting[]>;
    locations: CacheEntry<MedicalOffice[]>;
  };
  locations: {
    offices: CacheEntry<MedicalOffice[]>;
  };
  messages: {
    messages: CacheEntry<Message[]>;
  };
}

// Cache context type
interface DataCacheContextType {
  cache: CacheData;
  prefetchTabData: (tabName: keyof CacheData) => Promise<void>;
  invalidateTab: (tabName: keyof CacheData) => void;
  isCacheStale: (tabName: keyof CacheData) => boolean;
  isLoading: (tabName: keyof CacheData) => boolean;
}

const CACHE_STALE_TIME = 5 * 60 * 1000; // 5 minutes

const initialCache: CacheData = {
  dashboard: {
    upcomingMeetings: { data: null, timestamp: 0, loading: false },
    completedCount: { data: null, timestamp: 0, loading: false },
  },
  calendar: {
    meetings: { data: null, timestamp: 0, loading: false },
    locations: { data: null, timestamp: 0, loading: false },
  },
  locations: {
    offices: { data: null, timestamp: 0, loading: false },
  },
  messages: {
    messages: { data: null, timestamp: 0, loading: false },
  },
};

const DataCacheContext = createContext<DataCacheContextType | undefined>(
  undefined
);

export function DataCacheProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [cache, setCache] = useState<CacheData>(initialCache);
  const loadingRefs = useRef<Record<string, Promise<void>>>({});

  const updateCacheEntry = useCallback(
    <T,>(
      tabName: keyof CacheData,
      key: string,
      updater: (entry: CacheEntry<T>) => CacheEntry<T>
    ) => {
      setCache((prev) => ({
        ...prev,
        [tabName]: {
          ...prev[tabName],
          [key]: updater(
            prev[tabName][
              key as keyof (typeof prev)[typeof tabName]
            ] as CacheEntry<T>
          ),
        },
      }));
    },
    []
  );

  // Helper function to fetch accessible locations for the current user
  const fetchAccessibleLocations = useCallback(async (): Promise<
    MedicalOffice[]
  > => {
    if (!user) return [];

    try {
      // Filter locations based on user access through medical_rep_locations
      // First, get the user's medical_rep record
      const { data: medicalRep, error: medicalRepError } = await supabase
        .from("medical_reps")
        .select("id")
        .eq("profile_id", user.id)
        .eq("status", "active")
        .maybeSingle();

      if (medicalRepError) {
        console.error("Error fetching medical rep:", medicalRepError);
      }

      // Build query for locations
      const isAdmin = user.user_type === "admin";
      let locationsQuery;

      // If user is not admin and has a medical_rep record, first get accessible location IDs
      // This two-step approach avoids RLS recursion issues
      if (!isAdmin && medicalRep && (medicalRep as { id: string }).id) {
        const medicalRepId = (medicalRep as { id: string }).id;

        // Step 1: Get location IDs that this medical rep has access to
        const { data: repLocations, error: repLocError } = await supabase
          .from("medical_rep_locations")
          .select("location_id")
          .eq("medical_rep_id", medicalRepId)
          .eq("relationship_status", "active");

        if (repLocError) {
          console.error("Error fetching medical rep locations:", repLocError);
          return [];
        }

        const locationIds = (repLocations || []).map(
          (rl: any) => rl.location_id
        );

        // Step 2: Query locations using the IDs we just fetched
        if (locationIds.length === 0) {
          // No accessible locations for this rep
          return [];
        }

        locationsQuery = supabase
          .from("locations")
          .select(
            "id, name, address_line1, address_line2, city, state, postal_code, phone, status, created_at"
          )
          .eq("status", "active")
          .is("deleted_at", null)
          .in("id", locationIds);
      } else {
        // Admin or no medical_rep record - query all locations
        locationsQuery = supabase
          .from("locations")
          .select(
            "id, name, address_line1, address_line2, city, state, postal_code, phone, status, created_at"
          )
          .eq("status", "active")
          .is("deleted_at", null);
      }

      const { data: locationsData, error: locationsError } =
        await locationsQuery.order("name", { ascending: true });

      if (locationsError) {
        console.error("Error fetching locations:", locationsError);
        return [];
      }

      // Map database location structure to MedicalOffice type
      const offices: MedicalOffice[] = (locationsData || []).map(
        (loc: any) => ({
          id: loc.id,
          name: loc.name,
          address: loc.address_line1 || "",
          city: loc.city || "",
          state: loc.state || "",
          zip_code: loc.postal_code || "",
          phone: loc.phone || "",
          latitude: 0, // TODO: Add latitude/longitude to locations table if needed
          longitude: 0,
          created_at: loc.created_at,
          image_url: undefined, // Locations table doesn't have image_url column
        })
      );

      return offices;
    } catch (error) {
      console.error("Unexpected error fetching locations:", error);
      return [];
    }
  }, [user]);

  const prefetchTabData = useCallback(
    async (tabName: keyof CacheData) => {
      if (!user) return;

      // Prevent duplicate fetches
      const loadingKey = `${tabName}-${user.id}`;
      if (loadingKey in loadingRefs.current) {
        return loadingRefs.current[loadingKey];
      }

      const fetchPromise = (async () => {
        try {
          switch (tabName) {
            case "dashboard": {
              // Mark as loading
              updateCacheEntry(tabName, "upcomingMeetings", (entry) => ({
                ...entry,
                loading: true,
              }));
              updateCacheEntry(tabName, "completedCount", (entry) => ({
                ...entry,
                loading: true,
              }));

              // Get user's medical_rep_id if they're a medical rep
              let medicalRepId: string | null = null;
              if (user.user_type === "medical_rep") {
                const { data: medicalRep } = await supabase
                  .from("medical_reps")
                  .select("id")
                  .eq("profile_id", user.id)
                  .eq("status", "active")
                  .maybeSingle();

                if (medicalRep && (medicalRep as { id: string }).id) {
                  medicalRepId = (medicalRep as { id: string }).id;
                }
              }

              const now = new Date().toISOString();

              // Fetch upcoming meetings (pending or approved, start_at in future)
              // Include location data in the query
              let upcomingMeetingsQuery = supabase
                .from("meetings")
                .select(
                  "id, location_id, medical_rep_id, requested_by_profile_id, provider_id, food_preferences_id, meeting_type, title, description, start_at, end_at, status, auto_approved, approved_by_profile_id, approved_at, created_at, updated_at, locations(id, name, address_line1, address_line2, city, state, postal_code, phone)"
                )
                .in("status", ["pending", "approved"])
                .gte("start_at", now)
                .order("start_at", { ascending: true });

              // Filter by medical_rep_id if user is a medical rep
              if (medicalRepId) {
                upcomingMeetingsQuery = upcomingMeetingsQuery.eq(
                  "medical_rep_id",
                  medicalRepId
                );
              } else if (user.user_type !== "admin") {
                // If not admin and not medical rep, filter by requested_by_profile_id
                upcomingMeetingsQuery = upcomingMeetingsQuery.eq(
                  "requested_by_profile_id",
                  user.id
                );
              }

              const { data: upcomingMeetingsData, error: upcomingError } =
                await upcomingMeetingsQuery;

              if (upcomingError) {
                console.error(
                  "Error fetching upcoming meetings:",
                  upcomingError
                );
              }

              // Fetch completed meetings count
              // Count approved meetings that are in the past
              let completedCountQuery = supabase
                .from("meetings")
                .select("id", { count: "exact", head: true })
                .eq("status", "approved")
                .lt("start_at", new Date().toISOString());

              if (medicalRepId) {
                completedCountQuery = completedCountQuery.eq(
                  "medical_rep_id",
                  medicalRepId
                );
              } else if (user.user_type !== "admin") {
                completedCountQuery = completedCountQuery.eq(
                  "requested_by_profile_id",
                  user.id
                );
              }

              const { count: completedCount, error: completedError } =
                await completedCountQuery;

              if (completedError) {
                console.error(
                  "Error fetching completed meetings count:",
                  completedError
                );
              }

              // Map the data to include location
              const upcomingMeetings: Meeting[] = (
                upcomingMeetingsData || []
              ).map((m: any) => ({
                id: m.id,
                location_id: m.location_id,
                medical_rep_id: m.medical_rep_id,
                requested_by_profile_id: m.requested_by_profile_id,
                provider_id: m.provider_id,
                food_preferences_id: m.food_preferences_id,
                meeting_type: m.meeting_type,
                title: m.title,
                description: m.description,
                start_at: m.start_at,
                end_at: m.end_at,
                status: m.status,
                auto_approved: m.auto_approved,
                approved_by_profile_id: m.approved_by_profile_id,
                approved_at: m.approved_at,
                created_at: m.created_at,
                updated_at: m.updated_at,
                location: m.locations
                  ? {
                      id: m.locations.id,
                      company_id: "", // Not fetched, but required by type
                      name: m.locations.name,
                      address_line1: m.locations.address_line1,
                      address_line2: m.locations.address_line2,
                      city: m.locations.city,
                      state: m.locations.state,
                      postal_code: m.locations.postal_code,
                      country: "", // Not fetched, but required by type
                      timezone: null,
                      phone: m.locations.phone,
                      status: m.locations.status || "active",
                      created_at: "",
                      updated_at: "",
                      deleted_at: null,
                      created_by: null,
                      updated_by: null,
                    }
                  : undefined,
              }));

              // Update cache
              updateCacheEntry(tabName, "upcomingMeetings", () => ({
                data: upcomingMeetings,
                timestamp: Date.now(),
                loading: false,
              }));
              updateCacheEntry(tabName, "completedCount", () => ({
                data: completedCount || 0,
                timestamp: Date.now(),
                loading: false,
              }));
              break;
            }

            case "calendar": {
              updateCacheEntry(tabName, "meetings", (entry) => ({
                ...entry,
                loading: true,
              }));
              updateCacheEntry(tabName, "locations", (entry) => ({
                ...entry,
                loading: true,
              }));

              const [meetings, locations] = await Promise.all([
                mockMeetingsService.getUpcomingMeetings(user.id),
                fetchAccessibleLocations(),
              ]);

              updateCacheEntry(tabName, "meetings", () => ({
                data: meetings,
                timestamp: Date.now(),
                loading: false,
              }));
              updateCacheEntry(tabName, "locations", () => ({
                data: locations,
                timestamp: Date.now(),
                loading: false,
              }));
              break;
            }

            case "locations": {
              updateCacheEntry(tabName, "offices", (entry) => ({
                ...entry,
                loading: true,
              }));

              const offices = await fetchAccessibleLocations();

              updateCacheEntry(tabName, "offices", () => ({
                data: offices,
                timestamp: Date.now(),
                loading: false,
              }));
              break;
            }

            case "messages": {
              updateCacheEntry(tabName, "messages", (entry) => ({
                ...entry,
                loading: true,
              }));

              // Fetch messages where user is either sender or recipient
              // Include location and profile data
              const { data: messagesData, error: messagesError } =
                await supabase
                  .from("messages")
                  .select(
                    "id, location_id, meeting_id, sender_profile_id, recipient_profile_id, body, sent_at, read_at, created_at, updated_at, locations(id, name, address_line1, address_line2, city, state, postal_code, phone), sender:profiles!sender_profile_id(id, full_name, email, phone, user_type, status), recipient:profiles!recipient_profile_id(id, full_name, email, phone, user_type, status)"
                  )
                  .or(
                    `sender_profile_id.eq.${user.id},recipient_profile_id.eq.${user.id}`
                  )
                  .order("sent_at", { ascending: false });

              if (messagesError) {
                console.error("Error fetching messages:", messagesError);
                updateCacheEntry(tabName, "messages", () => ({
                  data: [],
                  timestamp: Date.now(),
                  loading: false,
                }));
                break;
              }

              // Map the data to match Message interface
              // Supabase returns 'locations' (plural) but Message interface expects 'location' (singular)
              const messagesArray = (messagesData as any[]) || [];

              // Debug: log the structure to see what Supabase returns
              if (messagesArray.length > 0) {
                console.log(
                  "Sample message from Supabase:",
                  JSON.stringify(messagesArray[0], null, 2)
                );
                console.log(
                  "Location data in first message:",
                  messagesArray[0]?.locations
                );
              }

              const messages: Message[] = messagesArray.map((msg: any) => ({
                id: msg.id,
                location_id: msg.location_id,
                meeting_id: msg.meeting_id,
                sender_profile_id: msg.sender_profile_id,
                recipient_profile_id: msg.recipient_profile_id,
                body: msg.body,
                sent_at: msg.sent_at,
                read_at: msg.read_at,
                created_at: msg.created_at,
                updated_at: msg.updated_at,
                location: msg.locations
                  ? (msg.locations as Location)
                  : undefined,
                sender: msg.sender ? (msg.sender as Profile) : undefined,
                recipient: msg.recipient
                  ? (msg.recipient as Profile)
                  : undefined,
              }));

              // Sort by sent_at descending (newest first), fallback to created_at
              const sorted = messages.sort((a, b) => {
                const aTime = new Date(a.sent_at || a.created_at).getTime();
                const bTime = new Date(b.sent_at || b.created_at).getTime();
                return bTime - aTime;
              });

              updateCacheEntry(tabName, "messages", () => ({
                data: sorted,
                timestamp: Date.now(),
                loading: false,
              }));
              break;
            }
          }
        } catch (error) {
          console.error(`Error prefetching ${tabName}:`, error);
          // Mark as not loading on error
          setCache((prev) => {
            const tabCache = prev[tabName];
            const updated: any = {};
            Object.keys(tabCache).forEach((key) => {
              const entry = tabCache[
                key as keyof typeof tabCache
              ] as CacheEntry<any>;
              updated[key] = {
                data: entry.data,
                timestamp: entry.timestamp,
                loading: false,
              };
            });
            return {
              ...prev,
              [tabName]: updated,
            };
          });
        } finally {
          delete loadingRefs.current[loadingKey];
        }
      })();

      loadingRefs.current[loadingKey] = fetchPromise;
      return fetchPromise;
    },
    [user, updateCacheEntry, fetchAccessibleLocations]
  );

  const invalidateTab = useCallback((tabName: keyof CacheData) => {
    setCache((prev) => {
      const tabCache = prev[tabName];
      const invalidated: any = {};
      Object.keys(tabCache).forEach((key) => {
        invalidated[key] = {
          data: null,
          timestamp: 0,
          loading: false,
        };
      });
      return {
        ...prev,
        [tabName]: invalidated,
      };
    });
  }, []);

  const isCacheStale = useCallback(
    (tabName: keyof CacheData): boolean => {
      const tabCache = cache[tabName];
      const entries = Object.values(tabCache) as CacheEntry<any>[];

      // If any entry has no data, cache is stale
      if (entries.some((entry) => !entry.data)) {
        return true;
      }

      // If any entry is older than stale time, cache is stale
      const now = Date.now();
      return entries.some((entry) => now - entry.timestamp > CACHE_STALE_TIME);
    },
    [cache]
  );

  const isLoading = useCallback(
    (tabName: keyof CacheData): boolean => {
      const tabCache = cache[tabName];
      const entries = Object.values(tabCache) as CacheEntry<any>[];
      return entries.some((entry) => entry.loading);
    },
    [cache]
  );

  return (
    <DataCacheContext.Provider
      value={{
        cache,
        prefetchTabData,
        invalidateTab,
        isCacheStale,
        isLoading,
      }}
    >
      {children}
    </DataCacheContext.Provider>
  );
}

export function useDataCache() {
  const context = useContext(DataCacheContext);
  if (context === undefined) {
    throw new Error("useDataCache must be used within a DataCacheProvider");
  }
  return context;
}
