-- Create user_push_tokens table
create table "public"."user_push_tokens" (
  "id" uuid not null default gen_random_uuid(),
  "profile_id" uuid not null,
  "expo_push_token" text not null,
  "device_id" text,
  "created_at" timestamp with time zone not null default now(),
  "updated_at" timestamp with time zone not null default now(),
  constraint "user_push_tokens_pkey" primary key ("id"),
  constraint "user_push_tokens_profile_id_fkey" foreign key ("profile_id") references "public"."profiles"("id") on delete cascade,
  constraint "user_push_tokens_expo_push_token_key" unique ("expo_push_token")
);

-- Create indexes
create index "user_push_tokens_profile_id_idx" on "public"."user_push_tokens"("profile_id");
create index "user_push_tokens_expo_push_token_idx" on "public"."user_push_tokens"("expo_push_token");

-- Enable RLS
alter table "public"."user_push_tokens" enable row level security;

-- RLS Policy: Users can only see their own tokens
create policy "user_push_tokens_select_own"
  on "public"."user_push_tokens"
  for select
  using (auth.uid() = profile_id);

-- RLS Policy: Users can insert their own tokens
create policy "user_push_tokens_insert_own"
  on "public"."user_push_tokens"
  for insert
  with check (auth.uid() = profile_id);

-- RLS Policy: Users can update their own tokens
create policy "user_push_tokens_update_own"
  on "public"."user_push_tokens"
  for update
  using (auth.uid() = profile_id);

-- RLS Policy: Users can delete their own tokens
create policy "user_push_tokens_delete_own"
  on "public"."user_push_tokens"
  for delete
  using (auth.uid() = profile_id);

-- Add updated_at trigger
create trigger "user_push_tokens_updated_at"
  before update on "public"."user_push_tokens"
  for each row
  execute function "public"."handle_updated_at"();

