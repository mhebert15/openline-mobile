// Deno type declarations for Supabase Edge Functions
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

// @ts-ignore - Deno module resolution (works in Supabase Edge Functions runtime)
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore - Deno module resolution (works in Supabase Edge Functions runtime)
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const EXPO_PUSH_API_URL = "https://exp.host/--/api/v2/push/send";
const EXPO_PUSH_ACCESS_TOKEN = Deno.env.get("EXPO_PUSH_ACCESS_TOKEN") || "";

interface NotificationPayload {
  id: string;
  recipient_profile_id: string;
  notification_type: string;
  title: string;
  body: string;
  metadata: Record<string, any> | null;
}

interface ExpoPushMessage {
  to: string;
  sound: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  badge?: number;
}

serve(async (req: Request) => {
  try {
    // Get Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body
    const payload: NotificationPayload = await req.json();

    // Validate payload
    if (!payload.recipient_profile_id || !payload.title || !payload.body) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Fetch recipient's push tokens
    const { data: pushTokens, error: tokensError } = await supabase
      .from("user_push_tokens")
      .select("expo_push_token")
      .eq("profile_id", payload.recipient_profile_id);

    if (tokensError) {
      console.error("Error fetching push tokens:", tokensError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch push tokens" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!pushTokens || pushTokens.length === 0) {
      console.log("No push tokens found for user:", payload.recipient_profile_id);
      return new Response(
        JSON.stringify({ message: "No push tokens found", sent: 0 }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // Get unread count for badge
    const { count: unreadCount } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("recipient_profile_id", payload.recipient_profile_id)
      .is("read_at", null);

    // Build deep linking data based on notification type
    let deepLinkData: Record<string, any> = {
      notification_id: payload.id,
      notification_type: payload.notification_type,
    };

    if (payload.metadata) {
      if (payload.metadata.meeting_id) {
        deepLinkData.screen = "meeting-detail";
        deepLinkData.id = payload.metadata.meeting_id;
      } else if (payload.metadata.location_id) {
        deepLinkData.screen = "location-detail";
        deepLinkData.id = payload.metadata.location_id;
      }
    }

    // Prepare push messages for all tokens
    const messages: ExpoPushMessage[] = pushTokens.map((token: { expo_push_token: string }) => ({
      to: token.expo_push_token,
      sound: "default",
      title: payload.title,
      body: payload.body,
      data: deepLinkData,
      badge: unreadCount || undefined,
    }));

    // Send push notifications via Expo API
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
      "Accept-Encoding": "gzip, deflate",
    };

    if (EXPO_PUSH_ACCESS_TOKEN) {
      headers["Authorization"] = `Bearer ${EXPO_PUSH_ACCESS_TOKEN}`;
    }

    const response = await fetch(EXPO_PUSH_API_URL, {
      method: "POST",
      headers,
      body: JSON.stringify(messages),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Expo Push API error:", errorText);
      return new Response(
        JSON.stringify({ error: "Failed to send push notifications", details: errorText }),
        { status: response.status, headers: { "Content-Type": "application/json" } }
      );
    }

    const result = await response.json();
    const successCount = result.data?.filter((r: any) => r.status === "ok").length || 0;

    return new Response(
      JSON.stringify({
        message: "Push notifications sent",
        sent: successCount,
        total: messages.length,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in send-push-notification function:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});

