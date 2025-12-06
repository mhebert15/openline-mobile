-- Create function to call Edge Function via HTTP
-- Note: This uses pg_net extension if available, otherwise use http extension
-- For Supabase, we'll use Supabase Database Webhooks (configured in dashboard)
-- This migration creates a placeholder function that can be called manually if needed

-- Function to trigger push notification (can be called from triggers or manually)
create or replace function "public"."trigger_push_notification"(notification_id uuid)
returns void
language plpgsql
security definer
as $$
declare
  v_notification jsonb;
  v_supabase_url text;
  v_service_role_key text;
  v_response jsonb;
begin
  -- Get notification data
  select to_jsonb(n.*) into v_notification
  from "public"."notifications" n
  where n.id = notification_id;
  
  if v_notification is null then
    raise exception 'Notification not found: %', notification_id;
  end if;
  
  -- Note: In production, this should call Supabase Edge Function
  -- For now, we'll use Supabase Database Webhooks configured in the dashboard
  -- This function is a placeholder that can be extended if needed
  
  -- The actual push notification sending is handled by:
  -- 1. Database Webhook (configured in Supabase Dashboard) that calls the Edge Function
  -- 2. Or you can call this function manually and implement HTTP call to Edge Function
  
  -- For Supabase Database Webhooks setup:
  -- 1. Go to Supabase Dashboard > Database > Webhooks
  -- 2. Create new webhook on 'notifications' table INSERT event
  -- 3. Set URL to: https://[project-ref].supabase.co/functions/v1/send-push-notification
  -- 4. Set HTTP method to POST
  -- 5. Set HTTP headers: { "Authorization": "Bearer [service-role-key]" }
  -- 6. Set payload to: { "id": "{{ $1.id }}", "recipient_profile_id": "{{ $1.recipient_profile_id }}", ... }
  
  return;
end;
$$;

-- Create trigger to call push notification function after notification insert
-- Note: This trigger calls the function, but actual HTTP call should be via Database Webhook
create or replace function "public"."notify_push_on_insert"()
returns trigger
language plpgsql
security definer
as $$
begin
  -- Call the push notification trigger function
  -- In production, this should be replaced with Database Webhook
  perform "public"."trigger_push_notification"(NEW.id);
  
  return NEW;
end;
$$;

-- Create trigger
drop trigger if exists "notifications_trigger_push" on "public"."notifications";
create trigger "notifications_trigger_push"
  after insert on "public"."notifications"
  for each row
  execute function "public"."notify_push_on_insert"();

-- Note: For production, disable the trigger above and use Supabase Database Webhooks instead
-- The webhook should be configured to POST to the Edge Function URL with the notification data

