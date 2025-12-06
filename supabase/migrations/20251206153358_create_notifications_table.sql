-- Create notifications table
create table "public"."notifications" (
  "id" uuid not null default gen_random_uuid(),
  "recipient_profile_id" uuid not null,
  "notification_type" text not null,
  "title" text not null,
  "body" text not null,
  "metadata" jsonb,
  "read_at" timestamp with time zone,
  "created_at" timestamp with time zone not null default now(),
  "updated_at" timestamp with time zone not null default now(),
  constraint "notifications_pkey" primary key ("id"),
  constraint "notifications_recipient_profile_id_fkey" foreign key ("recipient_profile_id") references "public"."profiles"("id") on delete cascade,
  constraint "notifications_notification_type_check" check (
    "notification_type" = ANY (
      ARRAY[
        'meeting_approved'::text,
        'meeting_declined'::text,
        'location_invited'::text,
        'medication_requested'::text,
        'medication_cancelled'::text
      ]
    )
  )
);

-- Create indexes
create index "notifications_recipient_profile_id_idx" on "public"."notifications"("recipient_profile_id");
create index "notifications_read_at_idx" on "public"."notifications"("read_at");
create index "notifications_created_at_idx" on "public"."notifications"("created_at" desc);
create index "notifications_notification_type_idx" on "public"."notifications"("notification_type");

-- Enable RLS
alter table "public"."notifications" enable row level security;

-- RLS Policy: Users can only see their own notifications
create policy "notifications_select_own"
  on "public"."notifications"
  for select
  using (auth.uid() = recipient_profile_id);

-- RLS Policy: Users can update their own notifications (for marking as read)
create policy "notifications_update_own"
  on "public"."notifications"
  for update
  using (auth.uid() = recipient_profile_id);

-- Add updated_at trigger
create trigger "notifications_updated_at"
  before update on "public"."notifications"
  for each row
  execute function "public"."handle_updated_at"();

