import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { supabase } from "@/lib/supabase/client";
import { Notification } from "@/lib/types/database.types";
import {
  fetchNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
} from "@/lib/services/notifications";
import type { RealtimeChannel } from "@supabase/supabase-js";

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  loadMore: () => Promise<void>;
  hasMore: boolean;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

export function NotificationProvider({
  children,
  profileId,
}: {
  children: React.ReactNode;
  profileId: string | null;
}) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const limit = 20;

  // Fetch notifications
  const refreshNotifications = useCallback(async () => {
    if (!profileId) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    setLoading(true);
    try {
      const result = await fetchNotifications(profileId, { limit, offset: 0 });
      setNotifications(result.notifications);
      setOffset(result.notifications.length);
      setHasMore(result.notifications.length >= limit);

      // Update unread count
      const count = await getUnreadCount(profileId);
      setUnreadCount(count);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  }, [profileId, limit]);

  // Load more notifications
  const loadMore = useCallback(async () => {
    if (!profileId || !hasMore || loading) return;

    setLoading(true);
    try {
      const result = await fetchNotifications(profileId, { limit, offset });
      if (result.notifications.length > 0) {
        setNotifications((prev) => [...prev, ...result.notifications]);
        setOffset((prev) => prev + result.notifications.length);
        setHasMore(result.notifications.length >= limit);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error("Error loading more notifications:", error);
    } finally {
      setLoading(false);
    }
  }, [profileId, limit, offset, hasMore, loading]);

  // Mark notification as read
  const handleMarkAsRead = useCallback(
    async (notificationId: string) => {
      try {
        await markAsRead(notificationId);
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notificationId ? { ...n, read_at: new Date().toISOString() } : n
          )
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (error) {
        console.error("Error marking notification as read:", error);
        throw error;
      }
    },
    []
  );

  // Mark all notifications as read
  const handleMarkAllAsRead = useCallback(async () => {
    if (!profileId) return;

    try {
      await markAllAsRead(profileId);
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, read_at: new Date().toISOString() }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      throw error;
    }
  }, [profileId]);

  // Set up real-time subscription
  useEffect(() => {
    if (!profileId) {
      // Clean up subscription if no profile
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      return;
    }

    // Subscribe to notifications table changes
    const channel = supabase
      .channel(`notifications:${profileId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `recipient_profile_id=eq.${profileId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const newNotification = payload.new as Notification;
            setNotifications((prev) => [newNotification, ...prev]);
            if (!newNotification.read_at) {
              setUnreadCount((prev) => prev + 1);
            }
          } else if (payload.eventType === "UPDATE") {
            const updatedNotification = payload.new as Notification;
            setNotifications((prev) =>
              prev.map((n) =>
                n.id === updatedNotification.id ? updatedNotification : n
              )
            );
            // Update unread count if read_at changed
            const oldNotification = payload.old as Notification;
            if (!oldNotification.read_at && updatedNotification.read_at) {
              setUnreadCount((prev) => Math.max(0, prev - 1));
            } else if (oldNotification.read_at && !updatedNotification.read_at) {
              setUnreadCount((prev) => prev + 1);
            }
          }
        }
      )
      .subscribe();

    channelRef.current = channel;

    // Initial fetch
    refreshNotifications();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [profileId, refreshNotifications]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        markAsRead: handleMarkAsRead,
        markAllAsRead: handleMarkAllAsRead,
        refreshNotifications,
        loadMore,
        hasMore,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
}

