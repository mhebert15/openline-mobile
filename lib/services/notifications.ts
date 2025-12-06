import { supabase } from "@/lib/supabase/client";
import { Notification } from "@/lib/types/database.types";

export interface FetchNotificationsOptions {
  limit?: number;
  offset?: number;
}

export interface FetchNotificationsResult {
  notifications: Notification[];
  total: number;
}

/**
 * Fetch notifications for a user with pagination
 */
export async function fetchNotifications(
  profileId: string,
  options: FetchNotificationsOptions = {}
): Promise<FetchNotificationsResult> {
  const { limit = 20, offset = 0 } = options;

  const { data, error, count } = await supabase
    .from("notifications")
    .select("*", { count: "exact" })
    .eq("recipient_profile_id", profileId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error("Error fetching notifications:", error);
    throw error;
  }

  return {
    notifications: (data || []) as Notification[],
    total: count || 0,
  };
}

/**
 * Mark a single notification as read
 */
export async function markAsRead(notificationId: string): Promise<void> {
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() } as never)
    .eq("id", notificationId);

  if (error) {
    console.error("Error marking notification as read:", error);
    throw error;
  }
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllAsRead(profileId: string): Promise<void> {
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() } as never)
    .eq("recipient_profile_id", profileId)
    .is("read_at", null);

  if (error) {
    console.error("Error marking all notifications as read:", error);
    throw error;
  }
}

/**
 * Get count of unread notifications for a user
 */
export async function getUnreadCount(profileId: string): Promise<number> {
  const { count, error } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("recipient_profile_id", profileId)
    .is("read_at", null);

  if (error) {
    console.error("Error getting unread count:", error);
    throw error;
  }

  return count || 0;
}

