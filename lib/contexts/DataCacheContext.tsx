import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
} from "react";
import { useAuth } from "./AuthContext";
import {
  mockMeetingsService,
  mockOfficesService,
  mockMessagesService,
} from "@/lib/mock/services";
import type {
  Meeting,
  MedicalOffice,
  Message,
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

              const [upcomingMeetings, completedCount] = await Promise.all([
                mockMeetingsService.getUpcomingMeetings(user.id),
                mockMeetingsService.getCompletedMeetingsCount(user.id),
              ]);

              // Update cache
              updateCacheEntry(tabName, "upcomingMeetings", () => ({
                data: upcomingMeetings,
                timestamp: Date.now(),
                loading: false,
              }));
              updateCacheEntry(tabName, "completedCount", () => ({
                data: completedCount,
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
                mockOfficesService.getAllOffices(),
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

              const offices = await mockOfficesService.getAllOffices();

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

              const messages = await mockMessagesService.getMessages(user.id);
              // Sort by created_at descending (newest first)
              const sorted = messages.sort(
                (a, b) =>
                  new Date(b.created_at).getTime() -
                  new Date(a.created_at).getTime()
              );

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
    [user, updateCacheEntry]
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
