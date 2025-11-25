
  create table "public"."companies" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "website" text,
    "status" text not null default 'active'::text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "deleted_at" timestamp with time zone,
    "created_by" uuid,
    "updated_by" uuid
      );


alter table "public"."companies" enable row level security;


  create table "public"."dietary_restrictions" (
    "id" uuid not null default gen_random_uuid(),
    "key" text not null,
    "label" text not null,
    "description" text,
    "is_active" boolean not null default true,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."dietary_restrictions" enable row level security;


  create table "public"."food_categories" (
    "id" uuid not null default gen_random_uuid(),
    "key" text not null,
    "label" text not null,
    "description" text,
    "is_active" boolean not null default true,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."food_categories" enable row level security;


  create table "public"."food_preferences" (
    "id" uuid not null default gen_random_uuid(),
    "location_id" uuid not null,
    "scope" text not null default 'location'::text,
    "notes" text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."food_preferences" enable row level security;


  create table "public"."food_preferences_dietary_restrictions" (
    "id" uuid not null default gen_random_uuid(),
    "food_preference_id" uuid not null,
    "dietary_restriction_id" uuid not null,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."food_preferences_dietary_restrictions" enable row level security;


  create table "public"."food_preferences_disliked_categories" (
    "id" uuid not null default gen_random_uuid(),
    "food_preference_id" uuid not null,
    "food_category_id" uuid not null,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."food_preferences_disliked_categories" enable row level security;


  create table "public"."food_preferences_favorite_categories" (
    "id" uuid not null default gen_random_uuid(),
    "food_preference_id" uuid not null,
    "food_category_id" uuid not null,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."food_preferences_favorite_categories" enable row level security;


  create table "public"."location_preferred_time_slots" (
    "id" uuid not null default gen_random_uuid(),
    "location_id" uuid not null,
    "day_of_week" integer not null,
    "start_time" time without time zone not null,
    "end_time" time without time zone not null,
    "meeting_type" text,
    "is_active" boolean not null default true,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."location_preferred_time_slots" enable row level security;


  create table "public"."locations" (
    "id" uuid not null default gen_random_uuid(),
    "company_id" uuid not null,
    "name" text not null,
    "address_line1" text,
    "address_line2" text,
    "city" text,
    "state" text,
    "postal_code" text,
    "country" text default 'US'::text,
    "timezone" text,
    "phone" text,
    "status" text not null default 'active'::text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "deleted_at" timestamp with time zone,
    "created_by" uuid,
    "updated_by" uuid
      );


alter table "public"."locations" enable row level security;


  create table "public"."medical_rep_locations" (
    "id" uuid not null default gen_random_uuid(),
    "medical_rep_id" uuid not null,
    "location_id" uuid not null,
    "relationship_status" text not null default 'active'::text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."medical_rep_locations" enable row level security;


  create table "public"."medical_reps" (
    "id" uuid not null default gen_random_uuid(),
    "profile_id" uuid,
    "company_name" text,
    "territory" text,
    "specialty_areas" text[],
    "status" text not null default 'active'::text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."medical_reps" enable row level security;


  create table "public"."meetings" (
    "id" uuid not null default gen_random_uuid(),
    "location_id" uuid not null,
    "medical_rep_id" uuid not null,
    "requested_by_profile_id" uuid not null,
    "provider_id" uuid,
    "food_preferences_id" uuid,
    "meeting_type" text not null,
    "title" text,
    "description" text,
    "start_at" timestamp with time zone not null,
    "end_at" timestamp with time zone,
    "status" text not null default 'pending'::text,
    "auto_approved" boolean not null default false,
    "approved_by_profile_id" uuid,
    "approved_at" timestamp with time zone,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."meetings" enable row level security;


  create table "public"."messages" (
    "id" uuid not null default gen_random_uuid(),
    "location_id" uuid not null,
    "meeting_id" uuid,
    "sender_profile_id" uuid not null,
    "recipient_profile_id" uuid,
    "body" text not null,
    "sent_at" timestamp with time zone not null default now(),
    "read_at" timestamp with time zone,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."messages" enable row level security;


  create table "public"."profiles" (
    "id" uuid not null,
    "full_name" text not null,
    "email" text not null,
    "phone" text,
    "user_type" text not null default 'office_staff'::text,
    "default_company_id" uuid,
    "default_location_id" uuid,
    "status" text not null default 'active'::text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."profiles" enable row level security;


  create table "public"."providers" (
    "id" uuid not null default gen_random_uuid(),
    "location_id" uuid not null,
    "profile_id" uuid,
    "first_name" text not null,
    "last_name" text not null,
    "credential" text,
    "specialty" text,
    "email" text,
    "phone" text,
    "status" text not null default 'active'::text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."providers" enable row level security;


  create table "public"."user_roles" (
    "id" uuid not null default gen_random_uuid(),
    "profile_id" uuid not null,
    "location_id" uuid not null,
    "role" text not null,
    "status" text not null default 'active'::text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."user_roles" enable row level security;

CREATE UNIQUE INDEX companies_pkey ON public.companies USING btree (id);

CREATE INDEX companies_status_idx ON public.companies USING btree (status);

CREATE UNIQUE INDEX dietary_restrictions_key_key ON public.dietary_restrictions USING btree (key);

CREATE UNIQUE INDEX dietary_restrictions_pkey ON public.dietary_restrictions USING btree (id);

CREATE INDEX disliked_categories_category_id_idx ON public.food_preferences_disliked_categories USING btree (food_category_id);

CREATE INDEX disliked_categories_pref_id_idx ON public.food_preferences_disliked_categories USING btree (food_preference_id);

CREATE INDEX fav_categories_category_id_idx ON public.food_preferences_favorite_categories USING btree (food_category_id);

CREATE INDEX fav_categories_pref_id_idx ON public.food_preferences_favorite_categories USING btree (food_preference_id);

CREATE UNIQUE INDEX food_categories_key_key ON public.food_categories USING btree (key);

CREATE UNIQUE INDEX food_categories_pkey ON public.food_categories USING btree (id);

CREATE UNIQUE INDEX food_preferences_dietary_rest_food_preference_id_dietary_re_key ON public.food_preferences_dietary_restrictions USING btree (food_preference_id, dietary_restriction_id);

CREATE UNIQUE INDEX food_preferences_dietary_restrictions_pkey ON public.food_preferences_dietary_restrictions USING btree (id);

CREATE UNIQUE INDEX food_preferences_disliked_cat_food_preference_id_food_categ_key ON public.food_preferences_disliked_categories USING btree (food_preference_id, food_category_id);

CREATE UNIQUE INDEX food_preferences_disliked_categories_pkey ON public.food_preferences_disliked_categories USING btree (id);

CREATE UNIQUE INDEX food_preferences_favorite_cat_food_preference_id_food_categ_key ON public.food_preferences_favorite_categories USING btree (food_preference_id, food_category_id);

CREATE UNIQUE INDEX food_preferences_favorite_categories_pkey ON public.food_preferences_favorite_categories USING btree (id);

CREATE INDEX food_preferences_location_id_idx ON public.food_preferences USING btree (location_id);

CREATE UNIQUE INDEX food_preferences_location_id_scope_key ON public.food_preferences USING btree (location_id, scope);

CREATE UNIQUE INDEX food_preferences_pkey ON public.food_preferences USING btree (id);

CREATE INDEX fp_diet_pref_id_idx ON public.food_preferences_dietary_restrictions USING btree (food_preference_id);

CREATE INDEX fp_diet_restriction_id_idx ON public.food_preferences_dietary_restrictions USING btree (dietary_restriction_id);

CREATE UNIQUE INDEX location_preferred_time_slots_pkey ON public.location_preferred_time_slots USING btree (id);

CREATE INDEX locations_company_id_idx ON public.locations USING btree (company_id);

CREATE UNIQUE INDEX locations_pkey ON public.locations USING btree (id);

CREATE INDEX medical_rep_locations_location_id_idx ON public.medical_rep_locations USING btree (location_id);

CREATE INDEX medical_rep_locations_medical_rep_id_idx ON public.medical_rep_locations USING btree (medical_rep_id);

CREATE UNIQUE INDEX medical_rep_locations_medical_rep_id_location_id_key ON public.medical_rep_locations USING btree (medical_rep_id, location_id);

CREATE UNIQUE INDEX medical_rep_locations_pkey ON public.medical_rep_locations USING btree (id);

CREATE UNIQUE INDEX medical_reps_pkey ON public.medical_reps USING btree (id);

CREATE UNIQUE INDEX medical_reps_profile_id_key ON public.medical_reps USING btree (profile_id);

CREATE INDEX meetings_location_id_idx ON public.meetings USING btree (location_id);

CREATE INDEX meetings_medical_rep_id_idx ON public.meetings USING btree (medical_rep_id);

CREATE UNIQUE INDEX meetings_pkey ON public.meetings USING btree (id);

CREATE INDEX meetings_start_at_idx ON public.meetings USING btree (start_at);

CREATE INDEX messages_location_id_idx ON public.messages USING btree (location_id);

CREATE INDEX messages_meeting_id_idx ON public.messages USING btree (meeting_id);

CREATE UNIQUE INDEX messages_pkey ON public.messages USING btree (id);

CREATE INDEX messages_recipient_profile_id_idx ON public.messages USING btree (recipient_profile_id);

CREATE INDEX messages_sender_profile_id_idx ON public.messages USING btree (sender_profile_id);

CREATE INDEX preferred_slots_location_id_idx ON public.location_preferred_time_slots USING btree (location_id);

CREATE UNIQUE INDEX profiles_email_key ON public.profiles USING btree (email);

CREATE UNIQUE INDEX profiles_pkey ON public.profiles USING btree (id);

CREATE INDEX providers_location_id_idx ON public.providers USING btree (location_id);

CREATE UNIQUE INDEX providers_pkey ON public.providers USING btree (id);

CREATE UNIQUE INDEX providers_profile_id_key ON public.providers USING btree (profile_id);

CREATE INDEX user_roles_location_id_idx ON public.user_roles USING btree (location_id);

CREATE UNIQUE INDEX user_roles_pkey ON public.user_roles USING btree (id);

CREATE INDEX user_roles_profile_id_idx ON public.user_roles USING btree (profile_id);

CREATE UNIQUE INDEX user_roles_profile_id_location_id_role_key ON public.user_roles USING btree (profile_id, location_id, role);

alter table "public"."companies" add constraint "companies_pkey" PRIMARY KEY using index "companies_pkey";

alter table "public"."dietary_restrictions" add constraint "dietary_restrictions_pkey" PRIMARY KEY using index "dietary_restrictions_pkey";

alter table "public"."food_categories" add constraint "food_categories_pkey" PRIMARY KEY using index "food_categories_pkey";

alter table "public"."food_preferences" add constraint "food_preferences_pkey" PRIMARY KEY using index "food_preferences_pkey";

alter table "public"."food_preferences_dietary_restrictions" add constraint "food_preferences_dietary_restrictions_pkey" PRIMARY KEY using index "food_preferences_dietary_restrictions_pkey";

alter table "public"."food_preferences_disliked_categories" add constraint "food_preferences_disliked_categories_pkey" PRIMARY KEY using index "food_preferences_disliked_categories_pkey";

alter table "public"."food_preferences_favorite_categories" add constraint "food_preferences_favorite_categories_pkey" PRIMARY KEY using index "food_preferences_favorite_categories_pkey";

alter table "public"."location_preferred_time_slots" add constraint "location_preferred_time_slots_pkey" PRIMARY KEY using index "location_preferred_time_slots_pkey";

alter table "public"."locations" add constraint "locations_pkey" PRIMARY KEY using index "locations_pkey";

alter table "public"."medical_rep_locations" add constraint "medical_rep_locations_pkey" PRIMARY KEY using index "medical_rep_locations_pkey";

alter table "public"."medical_reps" add constraint "medical_reps_pkey" PRIMARY KEY using index "medical_reps_pkey";

alter table "public"."meetings" add constraint "meetings_pkey" PRIMARY KEY using index "meetings_pkey";

alter table "public"."messages" add constraint "messages_pkey" PRIMARY KEY using index "messages_pkey";

alter table "public"."profiles" add constraint "profiles_pkey" PRIMARY KEY using index "profiles_pkey";

alter table "public"."providers" add constraint "providers_pkey" PRIMARY KEY using index "providers_pkey";

alter table "public"."user_roles" add constraint "user_roles_pkey" PRIMARY KEY using index "user_roles_pkey";

alter table "public"."companies" add constraint "companies_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) not valid;

alter table "public"."companies" validate constraint "companies_created_by_fkey";

alter table "public"."companies" add constraint "companies_updated_by_fkey" FOREIGN KEY (updated_by) REFERENCES auth.users(id) not valid;

alter table "public"."companies" validate constraint "companies_updated_by_fkey";

alter table "public"."dietary_restrictions" add constraint "dietary_restrictions_key_key" UNIQUE using index "dietary_restrictions_key_key";

alter table "public"."food_categories" add constraint "food_categories_key_key" UNIQUE using index "food_categories_key_key";

alter table "public"."food_preferences" add constraint "food_preferences_location_id_fkey" FOREIGN KEY (location_id) REFERENCES public.locations(id) ON DELETE CASCADE not valid;

alter table "public"."food_preferences" validate constraint "food_preferences_location_id_fkey";

alter table "public"."food_preferences" add constraint "food_preferences_location_id_scope_key" UNIQUE using index "food_preferences_location_id_scope_key";

alter table "public"."food_preferences_dietary_restrictions" add constraint "food_preferences_dietary_rest_food_preference_id_dietary_re_key" UNIQUE using index "food_preferences_dietary_rest_food_preference_id_dietary_re_key";

alter table "public"."food_preferences_dietary_restrictions" add constraint "food_preferences_dietary_restrictio_dietary_restriction_id_fkey" FOREIGN KEY (dietary_restriction_id) REFERENCES public.dietary_restrictions(id) ON DELETE RESTRICT not valid;

alter table "public"."food_preferences_dietary_restrictions" validate constraint "food_preferences_dietary_restrictio_dietary_restriction_id_fkey";

alter table "public"."food_preferences_dietary_restrictions" add constraint "food_preferences_dietary_restrictions_food_preference_id_fkey" FOREIGN KEY (food_preference_id) REFERENCES public.food_preferences(id) ON DELETE CASCADE not valid;

alter table "public"."food_preferences_dietary_restrictions" validate constraint "food_preferences_dietary_restrictions_food_preference_id_fkey";

alter table "public"."food_preferences_disliked_categories" add constraint "food_preferences_disliked_cat_food_preference_id_food_categ_key" UNIQUE using index "food_preferences_disliked_cat_food_preference_id_food_categ_key";

alter table "public"."food_preferences_disliked_categories" add constraint "food_preferences_disliked_categories_food_category_id_fkey" FOREIGN KEY (food_category_id) REFERENCES public.food_categories(id) ON DELETE RESTRICT not valid;

alter table "public"."food_preferences_disliked_categories" validate constraint "food_preferences_disliked_categories_food_category_id_fkey";

alter table "public"."food_preferences_disliked_categories" add constraint "food_preferences_disliked_categories_food_preference_id_fkey" FOREIGN KEY (food_preference_id) REFERENCES public.food_preferences(id) ON DELETE CASCADE not valid;

alter table "public"."food_preferences_disliked_categories" validate constraint "food_preferences_disliked_categories_food_preference_id_fkey";

alter table "public"."food_preferences_favorite_categories" add constraint "food_preferences_favorite_cat_food_preference_id_food_categ_key" UNIQUE using index "food_preferences_favorite_cat_food_preference_id_food_categ_key";

alter table "public"."food_preferences_favorite_categories" add constraint "food_preferences_favorite_categories_food_category_id_fkey" FOREIGN KEY (food_category_id) REFERENCES public.food_categories(id) ON DELETE RESTRICT not valid;

alter table "public"."food_preferences_favorite_categories" validate constraint "food_preferences_favorite_categories_food_category_id_fkey";

alter table "public"."food_preferences_favorite_categories" add constraint "food_preferences_favorite_categories_food_preference_id_fkey" FOREIGN KEY (food_preference_id) REFERENCES public.food_preferences(id) ON DELETE CASCADE not valid;

alter table "public"."food_preferences_favorite_categories" validate constraint "food_preferences_favorite_categories_food_preference_id_fkey";

alter table "public"."location_preferred_time_slots" add constraint "location_preferred_time_slots_day_of_week_check" CHECK (((day_of_week >= 0) AND (day_of_week <= 6))) not valid;

alter table "public"."location_preferred_time_slots" validate constraint "location_preferred_time_slots_day_of_week_check";

alter table "public"."location_preferred_time_slots" add constraint "location_preferred_time_slots_location_id_fkey" FOREIGN KEY (location_id) REFERENCES public.locations(id) ON DELETE CASCADE not valid;

alter table "public"."location_preferred_time_slots" validate constraint "location_preferred_time_slots_location_id_fkey";

alter table "public"."locations" add constraint "locations_company_id_fkey" FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE not valid;

alter table "public"."locations" validate constraint "locations_company_id_fkey";

alter table "public"."locations" add constraint "locations_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) not valid;

alter table "public"."locations" validate constraint "locations_created_by_fkey";

alter table "public"."locations" add constraint "locations_updated_by_fkey" FOREIGN KEY (updated_by) REFERENCES auth.users(id) not valid;

alter table "public"."locations" validate constraint "locations_updated_by_fkey";

alter table "public"."medical_rep_locations" add constraint "medical_rep_locations_location_id_fkey" FOREIGN KEY (location_id) REFERENCES public.locations(id) ON DELETE CASCADE not valid;

alter table "public"."medical_rep_locations" validate constraint "medical_rep_locations_location_id_fkey";

alter table "public"."medical_rep_locations" add constraint "medical_rep_locations_medical_rep_id_fkey" FOREIGN KEY (medical_rep_id) REFERENCES public.medical_reps(id) ON DELETE CASCADE not valid;

alter table "public"."medical_rep_locations" validate constraint "medical_rep_locations_medical_rep_id_fkey";

alter table "public"."medical_rep_locations" add constraint "medical_rep_locations_medical_rep_id_location_id_key" UNIQUE using index "medical_rep_locations_medical_rep_id_location_id_key";

alter table "public"."medical_reps" add constraint "medical_reps_profile_id_fkey" FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."medical_reps" validate constraint "medical_reps_profile_id_fkey";

alter table "public"."medical_reps" add constraint "medical_reps_profile_id_key" UNIQUE using index "medical_reps_profile_id_key";

alter table "public"."meetings" add constraint "meetings_approved_by_profile_id_fkey" FOREIGN KEY (approved_by_profile_id) REFERENCES public.profiles(id) not valid;

alter table "public"."meetings" validate constraint "meetings_approved_by_profile_id_fkey";

alter table "public"."meetings" add constraint "meetings_food_preferences_id_fkey" FOREIGN KEY (food_preferences_id) REFERENCES public.food_preferences(id) not valid;

alter table "public"."meetings" validate constraint "meetings_food_preferences_id_fkey";

alter table "public"."meetings" add constraint "meetings_location_id_fkey" FOREIGN KEY (location_id) REFERENCES public.locations(id) ON DELETE CASCADE not valid;

alter table "public"."meetings" validate constraint "meetings_location_id_fkey";

alter table "public"."meetings" add constraint "meetings_medical_rep_id_fkey" FOREIGN KEY (medical_rep_id) REFERENCES public.medical_reps(id) not valid;

alter table "public"."meetings" validate constraint "meetings_medical_rep_id_fkey";

alter table "public"."meetings" add constraint "meetings_provider_id_fkey" FOREIGN KEY (provider_id) REFERENCES public.providers(id) not valid;

alter table "public"."meetings" validate constraint "meetings_provider_id_fkey";

alter table "public"."meetings" add constraint "meetings_requested_by_profile_id_fkey" FOREIGN KEY (requested_by_profile_id) REFERENCES public.profiles(id) not valid;

alter table "public"."meetings" validate constraint "meetings_requested_by_profile_id_fkey";

alter table "public"."meetings" add constraint "meetings_status_check" CHECK ((status = ANY (ARRAY['pending'::text, 'approved'::text, 'declined'::text, 'cancelled'::text, 'completed'::text]))) not valid;

alter table "public"."meetings" validate constraint "meetings_status_check";

alter table "public"."messages" add constraint "messages_location_id_fkey" FOREIGN KEY (location_id) REFERENCES public.locations(id) ON DELETE CASCADE not valid;

alter table "public"."messages" validate constraint "messages_location_id_fkey";

alter table "public"."messages" add constraint "messages_meeting_id_fkey" FOREIGN KEY (meeting_id) REFERENCES public.meetings(id) ON DELETE SET NULL not valid;

alter table "public"."messages" validate constraint "messages_meeting_id_fkey";

alter table "public"."messages" add constraint "messages_recipient_profile_id_fkey" FOREIGN KEY (recipient_profile_id) REFERENCES public.profiles(id) not valid;

alter table "public"."messages" validate constraint "messages_recipient_profile_id_fkey";

alter table "public"."messages" add constraint "messages_sender_profile_id_fkey" FOREIGN KEY (sender_profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."messages" validate constraint "messages_sender_profile_id_fkey";

alter table "public"."profiles" add constraint "profiles_default_company_id_fkey" FOREIGN KEY (default_company_id) REFERENCES public.companies(id) not valid;

alter table "public"."profiles" validate constraint "profiles_default_company_id_fkey";

alter table "public"."profiles" add constraint "profiles_default_location_id_fkey" FOREIGN KEY (default_location_id) REFERENCES public.locations(id) not valid;

alter table "public"."profiles" validate constraint "profiles_default_location_id_fkey";

alter table "public"."profiles" add constraint "profiles_email_key" UNIQUE using index "profiles_email_key";

alter table "public"."profiles" add constraint "profiles_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."profiles" validate constraint "profiles_id_fkey";

alter table "public"."providers" add constraint "providers_location_id_fkey" FOREIGN KEY (location_id) REFERENCES public.locations(id) ON DELETE CASCADE not valid;

alter table "public"."providers" validate constraint "providers_location_id_fkey";

alter table "public"."providers" add constraint "providers_profile_id_fkey" FOREIGN KEY (profile_id) REFERENCES public.profiles(id) not valid;

alter table "public"."providers" validate constraint "providers_profile_id_fkey";

alter table "public"."providers" add constraint "providers_profile_id_key" UNIQUE using index "providers_profile_id_key";

alter table "public"."user_roles" add constraint "user_roles_location_id_fkey" FOREIGN KEY (location_id) REFERENCES public.locations(id) ON DELETE CASCADE not valid;

alter table "public"."user_roles" validate constraint "user_roles_location_id_fkey";

alter table "public"."user_roles" add constraint "user_roles_profile_id_fkey" FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."user_roles" validate constraint "user_roles_profile_id_fkey";

alter table "public"."user_roles" add constraint "user_roles_profile_id_location_id_role_key" UNIQUE using index "user_roles_profile_id_location_id_role_key";

alter table "public"."user_roles" add constraint "user_roles_role_check" CHECK ((role = ANY (ARRAY['office_staff'::text, 'location_admin'::text, 'scheduler'::text, 'rep'::text]))) not valid;

alter table "public"."user_roles" validate constraint "user_roles_role_check";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.is_admin()
 RETURNS boolean
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.user_type in ('admin', 'super_admin')
  );
$function$
;

CREATE OR REPLACE FUNCTION public.is_location_admin(loc_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  select exists (
    select 1
    from public.user_roles ur
    where ur.profile_id = auth.uid()
      and ur.location_id = loc_id
      and ur.status = 'active'
      and ur.role = 'location_admin'
  );
$function$
;

CREATE OR REPLACE FUNCTION public.is_location_office_member(loc_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  select exists (
    select 1
    from public.user_roles ur
    where ur.profile_id = auth.uid()
      and ur.location_id = loc_id
      and ur.status = 'active'
      and ur.role in ('office_staff', 'location_admin', 'scheduler')
  );
$function$
;

CREATE OR REPLACE FUNCTION public.is_location_participant(loc_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  select public.is_location_office_member(loc_id)
      or public.is_location_rep(loc_id);
$function$
;

CREATE OR REPLACE FUNCTION public.is_location_rep(loc_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  select exists (
    select 1
    from public.medical_reps mr
    join public.medical_rep_locations mrl
      on mrl.medical_rep_id = mr.id
    where mr.profile_id = auth.uid()
      and mrl.location_id = loc_id
      and mrl.relationship_status = 'active'
  );
$function$
;

CREATE OR REPLACE FUNCTION public.is_self(profile_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  select profile_id = auth.uid();
$function$
;

grant delete on table "public"."companies" to "anon";

grant insert on table "public"."companies" to "anon";

grant references on table "public"."companies" to "anon";

grant select on table "public"."companies" to "anon";

grant trigger on table "public"."companies" to "anon";

grant truncate on table "public"."companies" to "anon";

grant update on table "public"."companies" to "anon";

grant delete on table "public"."companies" to "authenticated";

grant insert on table "public"."companies" to "authenticated";

grant references on table "public"."companies" to "authenticated";

grant select on table "public"."companies" to "authenticated";

grant trigger on table "public"."companies" to "authenticated";

grant truncate on table "public"."companies" to "authenticated";

grant update on table "public"."companies" to "authenticated";

grant delete on table "public"."companies" to "postgres";

grant insert on table "public"."companies" to "postgres";

grant references on table "public"."companies" to "postgres";

grant select on table "public"."companies" to "postgres";

grant trigger on table "public"."companies" to "postgres";

grant truncate on table "public"."companies" to "postgres";

grant update on table "public"."companies" to "postgres";

grant delete on table "public"."companies" to "service_role";

grant insert on table "public"."companies" to "service_role";

grant references on table "public"."companies" to "service_role";

grant select on table "public"."companies" to "service_role";

grant trigger on table "public"."companies" to "service_role";

grant truncate on table "public"."companies" to "service_role";

grant update on table "public"."companies" to "service_role";

grant delete on table "public"."dietary_restrictions" to "anon";

grant insert on table "public"."dietary_restrictions" to "anon";

grant references on table "public"."dietary_restrictions" to "anon";

grant select on table "public"."dietary_restrictions" to "anon";

grant trigger on table "public"."dietary_restrictions" to "anon";

grant truncate on table "public"."dietary_restrictions" to "anon";

grant update on table "public"."dietary_restrictions" to "anon";

grant delete on table "public"."dietary_restrictions" to "authenticated";

grant insert on table "public"."dietary_restrictions" to "authenticated";

grant references on table "public"."dietary_restrictions" to "authenticated";

grant select on table "public"."dietary_restrictions" to "authenticated";

grant trigger on table "public"."dietary_restrictions" to "authenticated";

grant truncate on table "public"."dietary_restrictions" to "authenticated";

grant update on table "public"."dietary_restrictions" to "authenticated";

grant delete on table "public"."dietary_restrictions" to "postgres";

grant insert on table "public"."dietary_restrictions" to "postgres";

grant references on table "public"."dietary_restrictions" to "postgres";

grant select on table "public"."dietary_restrictions" to "postgres";

grant trigger on table "public"."dietary_restrictions" to "postgres";

grant truncate on table "public"."dietary_restrictions" to "postgres";

grant update on table "public"."dietary_restrictions" to "postgres";

grant delete on table "public"."dietary_restrictions" to "service_role";

grant insert on table "public"."dietary_restrictions" to "service_role";

grant references on table "public"."dietary_restrictions" to "service_role";

grant select on table "public"."dietary_restrictions" to "service_role";

grant trigger on table "public"."dietary_restrictions" to "service_role";

grant truncate on table "public"."dietary_restrictions" to "service_role";

grant update on table "public"."dietary_restrictions" to "service_role";

grant delete on table "public"."food_categories" to "anon";

grant insert on table "public"."food_categories" to "anon";

grant references on table "public"."food_categories" to "anon";

grant select on table "public"."food_categories" to "anon";

grant trigger on table "public"."food_categories" to "anon";

grant truncate on table "public"."food_categories" to "anon";

grant update on table "public"."food_categories" to "anon";

grant delete on table "public"."food_categories" to "authenticated";

grant insert on table "public"."food_categories" to "authenticated";

grant references on table "public"."food_categories" to "authenticated";

grant select on table "public"."food_categories" to "authenticated";

grant trigger on table "public"."food_categories" to "authenticated";

grant truncate on table "public"."food_categories" to "authenticated";

grant update on table "public"."food_categories" to "authenticated";

grant delete on table "public"."food_categories" to "postgres";

grant insert on table "public"."food_categories" to "postgres";

grant references on table "public"."food_categories" to "postgres";

grant select on table "public"."food_categories" to "postgres";

grant trigger on table "public"."food_categories" to "postgres";

grant truncate on table "public"."food_categories" to "postgres";

grant update on table "public"."food_categories" to "postgres";

grant delete on table "public"."food_categories" to "service_role";

grant insert on table "public"."food_categories" to "service_role";

grant references on table "public"."food_categories" to "service_role";

grant select on table "public"."food_categories" to "service_role";

grant trigger on table "public"."food_categories" to "service_role";

grant truncate on table "public"."food_categories" to "service_role";

grant update on table "public"."food_categories" to "service_role";

grant delete on table "public"."food_preferences" to "anon";

grant insert on table "public"."food_preferences" to "anon";

grant references on table "public"."food_preferences" to "anon";

grant select on table "public"."food_preferences" to "anon";

grant trigger on table "public"."food_preferences" to "anon";

grant truncate on table "public"."food_preferences" to "anon";

grant update on table "public"."food_preferences" to "anon";

grant delete on table "public"."food_preferences" to "authenticated";

grant insert on table "public"."food_preferences" to "authenticated";

grant references on table "public"."food_preferences" to "authenticated";

grant select on table "public"."food_preferences" to "authenticated";

grant trigger on table "public"."food_preferences" to "authenticated";

grant truncate on table "public"."food_preferences" to "authenticated";

grant update on table "public"."food_preferences" to "authenticated";

grant delete on table "public"."food_preferences" to "postgres";

grant insert on table "public"."food_preferences" to "postgres";

grant references on table "public"."food_preferences" to "postgres";

grant select on table "public"."food_preferences" to "postgres";

grant trigger on table "public"."food_preferences" to "postgres";

grant truncate on table "public"."food_preferences" to "postgres";

grant update on table "public"."food_preferences" to "postgres";

grant delete on table "public"."food_preferences" to "service_role";

grant insert on table "public"."food_preferences" to "service_role";

grant references on table "public"."food_preferences" to "service_role";

grant select on table "public"."food_preferences" to "service_role";

grant trigger on table "public"."food_preferences" to "service_role";

grant truncate on table "public"."food_preferences" to "service_role";

grant update on table "public"."food_preferences" to "service_role";

grant delete on table "public"."food_preferences_dietary_restrictions" to "anon";

grant insert on table "public"."food_preferences_dietary_restrictions" to "anon";

grant references on table "public"."food_preferences_dietary_restrictions" to "anon";

grant select on table "public"."food_preferences_dietary_restrictions" to "anon";

grant trigger on table "public"."food_preferences_dietary_restrictions" to "anon";

grant truncate on table "public"."food_preferences_dietary_restrictions" to "anon";

grant update on table "public"."food_preferences_dietary_restrictions" to "anon";

grant delete on table "public"."food_preferences_dietary_restrictions" to "authenticated";

grant insert on table "public"."food_preferences_dietary_restrictions" to "authenticated";

grant references on table "public"."food_preferences_dietary_restrictions" to "authenticated";

grant select on table "public"."food_preferences_dietary_restrictions" to "authenticated";

grant trigger on table "public"."food_preferences_dietary_restrictions" to "authenticated";

grant truncate on table "public"."food_preferences_dietary_restrictions" to "authenticated";

grant update on table "public"."food_preferences_dietary_restrictions" to "authenticated";

grant delete on table "public"."food_preferences_dietary_restrictions" to "postgres";

grant insert on table "public"."food_preferences_dietary_restrictions" to "postgres";

grant references on table "public"."food_preferences_dietary_restrictions" to "postgres";

grant select on table "public"."food_preferences_dietary_restrictions" to "postgres";

grant trigger on table "public"."food_preferences_dietary_restrictions" to "postgres";

grant truncate on table "public"."food_preferences_dietary_restrictions" to "postgres";

grant update on table "public"."food_preferences_dietary_restrictions" to "postgres";

grant delete on table "public"."food_preferences_dietary_restrictions" to "service_role";

grant insert on table "public"."food_preferences_dietary_restrictions" to "service_role";

grant references on table "public"."food_preferences_dietary_restrictions" to "service_role";

grant select on table "public"."food_preferences_dietary_restrictions" to "service_role";

grant trigger on table "public"."food_preferences_dietary_restrictions" to "service_role";

grant truncate on table "public"."food_preferences_dietary_restrictions" to "service_role";

grant update on table "public"."food_preferences_dietary_restrictions" to "service_role";

grant delete on table "public"."food_preferences_disliked_categories" to "anon";

grant insert on table "public"."food_preferences_disliked_categories" to "anon";

grant references on table "public"."food_preferences_disliked_categories" to "anon";

grant select on table "public"."food_preferences_disliked_categories" to "anon";

grant trigger on table "public"."food_preferences_disliked_categories" to "anon";

grant truncate on table "public"."food_preferences_disliked_categories" to "anon";

grant update on table "public"."food_preferences_disliked_categories" to "anon";

grant delete on table "public"."food_preferences_disliked_categories" to "authenticated";

grant insert on table "public"."food_preferences_disliked_categories" to "authenticated";

grant references on table "public"."food_preferences_disliked_categories" to "authenticated";

grant select on table "public"."food_preferences_disliked_categories" to "authenticated";

grant trigger on table "public"."food_preferences_disliked_categories" to "authenticated";

grant truncate on table "public"."food_preferences_disliked_categories" to "authenticated";

grant update on table "public"."food_preferences_disliked_categories" to "authenticated";

grant delete on table "public"."food_preferences_disliked_categories" to "postgres";

grant insert on table "public"."food_preferences_disliked_categories" to "postgres";

grant references on table "public"."food_preferences_disliked_categories" to "postgres";

grant select on table "public"."food_preferences_disliked_categories" to "postgres";

grant trigger on table "public"."food_preferences_disliked_categories" to "postgres";

grant truncate on table "public"."food_preferences_disliked_categories" to "postgres";

grant update on table "public"."food_preferences_disliked_categories" to "postgres";

grant delete on table "public"."food_preferences_disliked_categories" to "service_role";

grant insert on table "public"."food_preferences_disliked_categories" to "service_role";

grant references on table "public"."food_preferences_disliked_categories" to "service_role";

grant select on table "public"."food_preferences_disliked_categories" to "service_role";

grant trigger on table "public"."food_preferences_disliked_categories" to "service_role";

grant truncate on table "public"."food_preferences_disliked_categories" to "service_role";

grant update on table "public"."food_preferences_disliked_categories" to "service_role";

grant delete on table "public"."food_preferences_favorite_categories" to "anon";

grant insert on table "public"."food_preferences_favorite_categories" to "anon";

grant references on table "public"."food_preferences_favorite_categories" to "anon";

grant select on table "public"."food_preferences_favorite_categories" to "anon";

grant trigger on table "public"."food_preferences_favorite_categories" to "anon";

grant truncate on table "public"."food_preferences_favorite_categories" to "anon";

grant update on table "public"."food_preferences_favorite_categories" to "anon";

grant delete on table "public"."food_preferences_favorite_categories" to "authenticated";

grant insert on table "public"."food_preferences_favorite_categories" to "authenticated";

grant references on table "public"."food_preferences_favorite_categories" to "authenticated";

grant select on table "public"."food_preferences_favorite_categories" to "authenticated";

grant trigger on table "public"."food_preferences_favorite_categories" to "authenticated";

grant truncate on table "public"."food_preferences_favorite_categories" to "authenticated";

grant update on table "public"."food_preferences_favorite_categories" to "authenticated";

grant delete on table "public"."food_preferences_favorite_categories" to "postgres";

grant insert on table "public"."food_preferences_favorite_categories" to "postgres";

grant references on table "public"."food_preferences_favorite_categories" to "postgres";

grant select on table "public"."food_preferences_favorite_categories" to "postgres";

grant trigger on table "public"."food_preferences_favorite_categories" to "postgres";

grant truncate on table "public"."food_preferences_favorite_categories" to "postgres";

grant update on table "public"."food_preferences_favorite_categories" to "postgres";

grant delete on table "public"."food_preferences_favorite_categories" to "service_role";

grant insert on table "public"."food_preferences_favorite_categories" to "service_role";

grant references on table "public"."food_preferences_favorite_categories" to "service_role";

grant select on table "public"."food_preferences_favorite_categories" to "service_role";

grant trigger on table "public"."food_preferences_favorite_categories" to "service_role";

grant truncate on table "public"."food_preferences_favorite_categories" to "service_role";

grant update on table "public"."food_preferences_favorite_categories" to "service_role";

grant delete on table "public"."location_preferred_time_slots" to "anon";

grant insert on table "public"."location_preferred_time_slots" to "anon";

grant references on table "public"."location_preferred_time_slots" to "anon";

grant select on table "public"."location_preferred_time_slots" to "anon";

grant trigger on table "public"."location_preferred_time_slots" to "anon";

grant truncate on table "public"."location_preferred_time_slots" to "anon";

grant update on table "public"."location_preferred_time_slots" to "anon";

grant delete on table "public"."location_preferred_time_slots" to "authenticated";

grant insert on table "public"."location_preferred_time_slots" to "authenticated";

grant references on table "public"."location_preferred_time_slots" to "authenticated";

grant select on table "public"."location_preferred_time_slots" to "authenticated";

grant trigger on table "public"."location_preferred_time_slots" to "authenticated";

grant truncate on table "public"."location_preferred_time_slots" to "authenticated";

grant update on table "public"."location_preferred_time_slots" to "authenticated";

grant delete on table "public"."location_preferred_time_slots" to "postgres";

grant insert on table "public"."location_preferred_time_slots" to "postgres";

grant references on table "public"."location_preferred_time_slots" to "postgres";

grant select on table "public"."location_preferred_time_slots" to "postgres";

grant trigger on table "public"."location_preferred_time_slots" to "postgres";

grant truncate on table "public"."location_preferred_time_slots" to "postgres";

grant update on table "public"."location_preferred_time_slots" to "postgres";

grant delete on table "public"."location_preferred_time_slots" to "service_role";

grant insert on table "public"."location_preferred_time_slots" to "service_role";

grant references on table "public"."location_preferred_time_slots" to "service_role";

grant select on table "public"."location_preferred_time_slots" to "service_role";

grant trigger on table "public"."location_preferred_time_slots" to "service_role";

grant truncate on table "public"."location_preferred_time_slots" to "service_role";

grant update on table "public"."location_preferred_time_slots" to "service_role";

grant delete on table "public"."locations" to "anon";

grant insert on table "public"."locations" to "anon";

grant references on table "public"."locations" to "anon";

grant select on table "public"."locations" to "anon";

grant trigger on table "public"."locations" to "anon";

grant truncate on table "public"."locations" to "anon";

grant update on table "public"."locations" to "anon";

grant delete on table "public"."locations" to "authenticated";

grant insert on table "public"."locations" to "authenticated";

grant references on table "public"."locations" to "authenticated";

grant select on table "public"."locations" to "authenticated";

grant trigger on table "public"."locations" to "authenticated";

grant truncate on table "public"."locations" to "authenticated";

grant update on table "public"."locations" to "authenticated";

grant delete on table "public"."locations" to "postgres";

grant insert on table "public"."locations" to "postgres";

grant references on table "public"."locations" to "postgres";

grant select on table "public"."locations" to "postgres";

grant trigger on table "public"."locations" to "postgres";

grant truncate on table "public"."locations" to "postgres";

grant update on table "public"."locations" to "postgres";

grant delete on table "public"."locations" to "service_role";

grant insert on table "public"."locations" to "service_role";

grant references on table "public"."locations" to "service_role";

grant select on table "public"."locations" to "service_role";

grant trigger on table "public"."locations" to "service_role";

grant truncate on table "public"."locations" to "service_role";

grant update on table "public"."locations" to "service_role";

grant delete on table "public"."medical_rep_locations" to "anon";

grant insert on table "public"."medical_rep_locations" to "anon";

grant references on table "public"."medical_rep_locations" to "anon";

grant select on table "public"."medical_rep_locations" to "anon";

grant trigger on table "public"."medical_rep_locations" to "anon";

grant truncate on table "public"."medical_rep_locations" to "anon";

grant update on table "public"."medical_rep_locations" to "anon";

grant delete on table "public"."medical_rep_locations" to "authenticated";

grant insert on table "public"."medical_rep_locations" to "authenticated";

grant references on table "public"."medical_rep_locations" to "authenticated";

grant select on table "public"."medical_rep_locations" to "authenticated";

grant trigger on table "public"."medical_rep_locations" to "authenticated";

grant truncate on table "public"."medical_rep_locations" to "authenticated";

grant update on table "public"."medical_rep_locations" to "authenticated";

grant delete on table "public"."medical_rep_locations" to "postgres";

grant insert on table "public"."medical_rep_locations" to "postgres";

grant references on table "public"."medical_rep_locations" to "postgres";

grant select on table "public"."medical_rep_locations" to "postgres";

grant trigger on table "public"."medical_rep_locations" to "postgres";

grant truncate on table "public"."medical_rep_locations" to "postgres";

grant update on table "public"."medical_rep_locations" to "postgres";

grant delete on table "public"."medical_rep_locations" to "service_role";

grant insert on table "public"."medical_rep_locations" to "service_role";

grant references on table "public"."medical_rep_locations" to "service_role";

grant select on table "public"."medical_rep_locations" to "service_role";

grant trigger on table "public"."medical_rep_locations" to "service_role";

grant truncate on table "public"."medical_rep_locations" to "service_role";

grant update on table "public"."medical_rep_locations" to "service_role";

grant delete on table "public"."medical_reps" to "anon";

grant insert on table "public"."medical_reps" to "anon";

grant references on table "public"."medical_reps" to "anon";

grant select on table "public"."medical_reps" to "anon";

grant trigger on table "public"."medical_reps" to "anon";

grant truncate on table "public"."medical_reps" to "anon";

grant update on table "public"."medical_reps" to "anon";

grant delete on table "public"."medical_reps" to "authenticated";

grant insert on table "public"."medical_reps" to "authenticated";

grant references on table "public"."medical_reps" to "authenticated";

grant select on table "public"."medical_reps" to "authenticated";

grant trigger on table "public"."medical_reps" to "authenticated";

grant truncate on table "public"."medical_reps" to "authenticated";

grant update on table "public"."medical_reps" to "authenticated";

grant delete on table "public"."medical_reps" to "postgres";

grant insert on table "public"."medical_reps" to "postgres";

grant references on table "public"."medical_reps" to "postgres";

grant select on table "public"."medical_reps" to "postgres";

grant trigger on table "public"."medical_reps" to "postgres";

grant truncate on table "public"."medical_reps" to "postgres";

grant update on table "public"."medical_reps" to "postgres";

grant delete on table "public"."medical_reps" to "service_role";

grant insert on table "public"."medical_reps" to "service_role";

grant references on table "public"."medical_reps" to "service_role";

grant select on table "public"."medical_reps" to "service_role";

grant trigger on table "public"."medical_reps" to "service_role";

grant truncate on table "public"."medical_reps" to "service_role";

grant update on table "public"."medical_reps" to "service_role";

grant delete on table "public"."meetings" to "anon";

grant insert on table "public"."meetings" to "anon";

grant references on table "public"."meetings" to "anon";

grant select on table "public"."meetings" to "anon";

grant trigger on table "public"."meetings" to "anon";

grant truncate on table "public"."meetings" to "anon";

grant update on table "public"."meetings" to "anon";

grant delete on table "public"."meetings" to "authenticated";

grant insert on table "public"."meetings" to "authenticated";

grant references on table "public"."meetings" to "authenticated";

grant select on table "public"."meetings" to "authenticated";

grant trigger on table "public"."meetings" to "authenticated";

grant truncate on table "public"."meetings" to "authenticated";

grant update on table "public"."meetings" to "authenticated";

grant delete on table "public"."meetings" to "postgres";

grant insert on table "public"."meetings" to "postgres";

grant references on table "public"."meetings" to "postgres";

grant select on table "public"."meetings" to "postgres";

grant trigger on table "public"."meetings" to "postgres";

grant truncate on table "public"."meetings" to "postgres";

grant update on table "public"."meetings" to "postgres";

grant delete on table "public"."meetings" to "service_role";

grant insert on table "public"."meetings" to "service_role";

grant references on table "public"."meetings" to "service_role";

grant select on table "public"."meetings" to "service_role";

grant trigger on table "public"."meetings" to "service_role";

grant truncate on table "public"."meetings" to "service_role";

grant update on table "public"."meetings" to "service_role";

grant delete on table "public"."messages" to "anon";

grant insert on table "public"."messages" to "anon";

grant references on table "public"."messages" to "anon";

grant select on table "public"."messages" to "anon";

grant trigger on table "public"."messages" to "anon";

grant truncate on table "public"."messages" to "anon";

grant update on table "public"."messages" to "anon";

grant delete on table "public"."messages" to "authenticated";

grant insert on table "public"."messages" to "authenticated";

grant references on table "public"."messages" to "authenticated";

grant select on table "public"."messages" to "authenticated";

grant trigger on table "public"."messages" to "authenticated";

grant truncate on table "public"."messages" to "authenticated";

grant update on table "public"."messages" to "authenticated";

grant delete on table "public"."messages" to "postgres";

grant insert on table "public"."messages" to "postgres";

grant references on table "public"."messages" to "postgres";

grant select on table "public"."messages" to "postgres";

grant trigger on table "public"."messages" to "postgres";

grant truncate on table "public"."messages" to "postgres";

grant update on table "public"."messages" to "postgres";

grant delete on table "public"."messages" to "service_role";

grant insert on table "public"."messages" to "service_role";

grant references on table "public"."messages" to "service_role";

grant select on table "public"."messages" to "service_role";

grant trigger on table "public"."messages" to "service_role";

grant truncate on table "public"."messages" to "service_role";

grant update on table "public"."messages" to "service_role";

grant delete on table "public"."profiles" to "anon";

grant insert on table "public"."profiles" to "anon";

grant references on table "public"."profiles" to "anon";

grant select on table "public"."profiles" to "anon";

grant trigger on table "public"."profiles" to "anon";

grant truncate on table "public"."profiles" to "anon";

grant update on table "public"."profiles" to "anon";

grant delete on table "public"."profiles" to "authenticated";

grant insert on table "public"."profiles" to "authenticated";

grant references on table "public"."profiles" to "authenticated";

grant select on table "public"."profiles" to "authenticated";

grant trigger on table "public"."profiles" to "authenticated";

grant truncate on table "public"."profiles" to "authenticated";

grant update on table "public"."profiles" to "authenticated";

grant delete on table "public"."profiles" to "postgres";

grant insert on table "public"."profiles" to "postgres";

grant references on table "public"."profiles" to "postgres";

grant select on table "public"."profiles" to "postgres";

grant trigger on table "public"."profiles" to "postgres";

grant truncate on table "public"."profiles" to "postgres";

grant update on table "public"."profiles" to "postgres";

grant delete on table "public"."profiles" to "service_role";

grant insert on table "public"."profiles" to "service_role";

grant references on table "public"."profiles" to "service_role";

grant select on table "public"."profiles" to "service_role";

grant trigger on table "public"."profiles" to "service_role";

grant truncate on table "public"."profiles" to "service_role";

grant update on table "public"."profiles" to "service_role";

grant delete on table "public"."providers" to "anon";

grant insert on table "public"."providers" to "anon";

grant references on table "public"."providers" to "anon";

grant select on table "public"."providers" to "anon";

grant trigger on table "public"."providers" to "anon";

grant truncate on table "public"."providers" to "anon";

grant update on table "public"."providers" to "anon";

grant delete on table "public"."providers" to "authenticated";

grant insert on table "public"."providers" to "authenticated";

grant references on table "public"."providers" to "authenticated";

grant select on table "public"."providers" to "authenticated";

grant trigger on table "public"."providers" to "authenticated";

grant truncate on table "public"."providers" to "authenticated";

grant update on table "public"."providers" to "authenticated";

grant delete on table "public"."providers" to "postgres";

grant insert on table "public"."providers" to "postgres";

grant references on table "public"."providers" to "postgres";

grant select on table "public"."providers" to "postgres";

grant trigger on table "public"."providers" to "postgres";

grant truncate on table "public"."providers" to "postgres";

grant update on table "public"."providers" to "postgres";

grant delete on table "public"."providers" to "service_role";

grant insert on table "public"."providers" to "service_role";

grant references on table "public"."providers" to "service_role";

grant select on table "public"."providers" to "service_role";

grant trigger on table "public"."providers" to "service_role";

grant truncate on table "public"."providers" to "service_role";

grant update on table "public"."providers" to "service_role";

grant delete on table "public"."user_roles" to "anon";

grant insert on table "public"."user_roles" to "anon";

grant references on table "public"."user_roles" to "anon";

grant select on table "public"."user_roles" to "anon";

grant trigger on table "public"."user_roles" to "anon";

grant truncate on table "public"."user_roles" to "anon";

grant update on table "public"."user_roles" to "anon";

grant delete on table "public"."user_roles" to "authenticated";

grant insert on table "public"."user_roles" to "authenticated";

grant references on table "public"."user_roles" to "authenticated";

grant select on table "public"."user_roles" to "authenticated";

grant trigger on table "public"."user_roles" to "authenticated";

grant truncate on table "public"."user_roles" to "authenticated";

grant update on table "public"."user_roles" to "authenticated";

grant delete on table "public"."user_roles" to "postgres";

grant insert on table "public"."user_roles" to "postgres";

grant references on table "public"."user_roles" to "postgres";

grant select on table "public"."user_roles" to "postgres";

grant trigger on table "public"."user_roles" to "postgres";

grant truncate on table "public"."user_roles" to "postgres";

grant update on table "public"."user_roles" to "postgres";

grant delete on table "public"."user_roles" to "service_role";

grant insert on table "public"."user_roles" to "service_role";

grant references on table "public"."user_roles" to "service_role";

grant select on table "public"."user_roles" to "service_role";

grant trigger on table "public"."user_roles" to "service_role";

grant truncate on table "public"."user_roles" to "service_role";

grant update on table "public"."user_roles" to "service_role";


  create policy "companies_delete_admin"
  on "public"."companies"
  as permissive
  for delete
  to public
using (public.is_admin());



  create policy "companies_insert_admin"
  on "public"."companies"
  as permissive
  for insert
  to public
with check (public.is_admin());



  create policy "companies_select_authenticated"
  on "public"."companies"
  as permissive
  for select
  to public
using ((auth.role() = 'authenticated'::text));



  create policy "companies_update_admin"
  on "public"."companies"
  as permissive
  for update
  to public
using (public.is_admin())
with check (public.is_admin());



  create policy "dietary_restrictions_delete_admin"
  on "public"."dietary_restrictions"
  as permissive
  for delete
  to public
using (public.is_admin());



  create policy "dietary_restrictions_insert_admin"
  on "public"."dietary_restrictions"
  as permissive
  for insert
  to public
with check (public.is_admin());



  create policy "dietary_restrictions_select_authenticated"
  on "public"."dietary_restrictions"
  as permissive
  for select
  to public
using ((auth.role() = 'authenticated'::text));



  create policy "dietary_restrictions_update_admin"
  on "public"."dietary_restrictions"
  as permissive
  for update
  to public
using (public.is_admin())
with check (public.is_admin());



  create policy "food_categories_delete_admin"
  on "public"."food_categories"
  as permissive
  for delete
  to public
using (public.is_admin());



  create policy "food_categories_insert_admin"
  on "public"."food_categories"
  as permissive
  for insert
  to public
with check (public.is_admin());



  create policy "food_categories_select_authenticated"
  on "public"."food_categories"
  as permissive
  for select
  to public
using ((auth.role() = 'authenticated'::text));



  create policy "food_categories_update_admin"
  on "public"."food_categories"
  as permissive
  for update
  to public
using (public.is_admin())
with check (public.is_admin());



  create policy "food_prefs_delete_loc_admin_or_admin"
  on "public"."food_preferences"
  as permissive
  for delete
  to public
using ((public.is_admin() OR public.is_location_admin(location_id)));



  create policy "food_prefs_insert_loc_admin_or_admin"
  on "public"."food_preferences"
  as permissive
  for insert
  to public
with check ((public.is_admin() OR public.is_location_admin(location_id)));



  create policy "food_prefs_select_participants_or_admin"
  on "public"."food_preferences"
  as permissive
  for select
  to public
using ((public.is_admin() OR public.is_location_participant(location_id)));



  create policy "food_prefs_update_loc_admin_or_admin"
  on "public"."food_preferences"
  as permissive
  for update
  to public
using ((public.is_admin() OR public.is_location_admin(location_id)))
with check ((public.is_admin() OR public.is_location_admin(location_id)));



  create policy "fp_diet_delete_loc_admin_or_admin"
  on "public"."food_preferences_dietary_restrictions"
  as permissive
  for delete
  to public
using ((public.is_admin() OR (EXISTS ( SELECT 1
   FROM public.food_preferences fp
  WHERE ((fp.id = food_preferences_dietary_restrictions.food_preference_id) AND public.is_location_admin(fp.location_id))))));



  create policy "fp_diet_insert_loc_admin_or_admin"
  on "public"."food_preferences_dietary_restrictions"
  as permissive
  for insert
  to public
with check ((public.is_admin() OR (EXISTS ( SELECT 1
   FROM public.food_preferences fp
  WHERE ((fp.id = food_preferences_dietary_restrictions.food_preference_id) AND public.is_location_admin(fp.location_id))))));



  create policy "fp_diet_select_participants_or_admin"
  on "public"."food_preferences_dietary_restrictions"
  as permissive
  for select
  to public
using ((public.is_admin() OR (EXISTS ( SELECT 1
   FROM public.food_preferences fp
  WHERE ((fp.id = food_preferences_dietary_restrictions.food_preference_id) AND public.is_location_participant(fp.location_id))))));



  create policy "fp_diet_update_loc_admin_or_admin"
  on "public"."food_preferences_dietary_restrictions"
  as permissive
  for update
  to public
using ((public.is_admin() OR (EXISTS ( SELECT 1
   FROM public.food_preferences fp
  WHERE ((fp.id = food_preferences_dietary_restrictions.food_preference_id) AND public.is_location_admin(fp.location_id))))))
with check ((public.is_admin() OR (EXISTS ( SELECT 1
   FROM public.food_preferences fp
  WHERE ((fp.id = food_preferences_dietary_restrictions.food_preference_id) AND public.is_location_admin(fp.location_id))))));



  create policy "fp_dislike_delete_loc_admin_or_admin"
  on "public"."food_preferences_disliked_categories"
  as permissive
  for delete
  to public
using ((public.is_admin() OR (EXISTS ( SELECT 1
   FROM public.food_preferences fp
  WHERE ((fp.id = food_preferences_disliked_categories.food_preference_id) AND public.is_location_admin(fp.location_id))))));



  create policy "fp_dislike_insert_loc_admin_or_admin"
  on "public"."food_preferences_disliked_categories"
  as permissive
  for insert
  to public
with check ((public.is_admin() OR (EXISTS ( SELECT 1
   FROM public.food_preferences fp
  WHERE ((fp.id = food_preferences_disliked_categories.food_preference_id) AND public.is_location_admin(fp.location_id))))));



  create policy "fp_dislike_select_participants_or_admin"
  on "public"."food_preferences_disliked_categories"
  as permissive
  for select
  to public
using ((public.is_admin() OR (EXISTS ( SELECT 1
   FROM public.food_preferences fp
  WHERE ((fp.id = food_preferences_disliked_categories.food_preference_id) AND public.is_location_participant(fp.location_id))))));



  create policy "fp_dislike_update_loc_admin_or_admin"
  on "public"."food_preferences_disliked_categories"
  as permissive
  for update
  to public
using ((public.is_admin() OR (EXISTS ( SELECT 1
   FROM public.food_preferences fp
  WHERE ((fp.id = food_preferences_disliked_categories.food_preference_id) AND public.is_location_admin(fp.location_id))))))
with check ((public.is_admin() OR (EXISTS ( SELECT 1
   FROM public.food_preferences fp
  WHERE ((fp.id = food_preferences_disliked_categories.food_preference_id) AND public.is_location_admin(fp.location_id))))));



  create policy "fp_fav_delete_loc_admin_or_admin"
  on "public"."food_preferences_favorite_categories"
  as permissive
  for delete
  to public
using ((public.is_admin() OR (EXISTS ( SELECT 1
   FROM public.food_preferences fp
  WHERE ((fp.id = food_preferences_favorite_categories.food_preference_id) AND public.is_location_admin(fp.location_id))))));



  create policy "fp_fav_insert_loc_admin_or_admin"
  on "public"."food_preferences_favorite_categories"
  as permissive
  for insert
  to public
with check ((public.is_admin() OR (EXISTS ( SELECT 1
   FROM public.food_preferences fp
  WHERE ((fp.id = food_preferences_favorite_categories.food_preference_id) AND public.is_location_admin(fp.location_id))))));



  create policy "fp_fav_select_participants_or_admin"
  on "public"."food_preferences_favorite_categories"
  as permissive
  for select
  to public
using ((public.is_admin() OR (EXISTS ( SELECT 1
   FROM public.food_preferences fp
  WHERE ((fp.id = food_preferences_favorite_categories.food_preference_id) AND public.is_location_participant(fp.location_id))))));



  create policy "fp_fav_update_loc_admin_or_admin"
  on "public"."food_preferences_favorite_categories"
  as permissive
  for update
  to public
using ((public.is_admin() OR (EXISTS ( SELECT 1
   FROM public.food_preferences fp
  WHERE ((fp.id = food_preferences_favorite_categories.food_preference_id) AND public.is_location_admin(fp.location_id))))))
with check ((public.is_admin() OR (EXISTS ( SELECT 1
   FROM public.food_preferences fp
  WHERE ((fp.id = food_preferences_favorite_categories.food_preference_id) AND public.is_location_admin(fp.location_id))))));



  create policy "slots_delete_loc_admin_or_admin"
  on "public"."location_preferred_time_slots"
  as permissive
  for delete
  to public
using ((public.is_admin() OR public.is_location_admin(location_id)));



  create policy "slots_insert_loc_admin_or_admin"
  on "public"."location_preferred_time_slots"
  as permissive
  for insert
  to public
with check ((public.is_admin() OR public.is_location_admin(location_id)));



  create policy "slots_select_participants_or_admin"
  on "public"."location_preferred_time_slots"
  as permissive
  for select
  to public
using ((public.is_admin() OR public.is_location_participant(location_id)));



  create policy "slots_update_loc_admin_or_admin"
  on "public"."location_preferred_time_slots"
  as permissive
  for update
  to public
using ((public.is_admin() OR public.is_location_admin(location_id)))
with check ((public.is_admin() OR public.is_location_admin(location_id)));



  create policy "locations_delete_admin"
  on "public"."locations"
  as permissive
  for delete
  to public
using (public.is_admin());



  create policy "locations_insert_admin"
  on "public"."locations"
  as permissive
  for insert
  to public
with check (public.is_admin());



  create policy "locations_select_authenticated"
  on "public"."locations"
  as permissive
  for select
  to public
using ((auth.role() = 'authenticated'::text));



  create policy "locations_update_admin"
  on "public"."locations"
  as permissive
  for update
  to public
using (public.is_admin())
with check (public.is_admin());



  create policy "mrl_delete_rep_loc_admin_or_admin"
  on "public"."medical_rep_locations"
  as permissive
  for delete
  to public
using ((public.is_admin() OR public.is_location_admin(location_id) OR (EXISTS ( SELECT 1
   FROM public.medical_reps mr
  WHERE ((mr.id = medical_rep_locations.medical_rep_id) AND (mr.profile_id = auth.uid()))))));



  create policy "mrl_insert_rep_loc_admin_or_admin"
  on "public"."medical_rep_locations"
  as permissive
  for insert
  to public
with check ((public.is_admin() OR public.is_location_admin(location_id) OR (EXISTS ( SELECT 1
   FROM public.medical_reps mr
  WHERE ((mr.id = medical_rep_locations.medical_rep_id) AND (mr.profile_id = auth.uid()))))));



  create policy "mrl_select_participants_or_admin"
  on "public"."medical_rep_locations"
  as permissive
  for select
  to public
using ((public.is_admin() OR public.is_location_participant(location_id)));



  create policy "mrl_update_rep_loc_admin_or_admin"
  on "public"."medical_rep_locations"
  as permissive
  for update
  to public
using ((public.is_admin() OR public.is_location_admin(location_id) OR (EXISTS ( SELECT 1
   FROM public.medical_reps mr
  WHERE ((mr.id = medical_rep_locations.medical_rep_id) AND (mr.profile_id = auth.uid()))))))
with check ((public.is_admin() OR public.is_location_admin(location_id) OR (EXISTS ( SELECT 1
   FROM public.medical_reps mr
  WHERE ((mr.id = medical_rep_locations.medical_rep_id) AND (mr.profile_id = auth.uid()))))));



  create policy "medical_reps_insert_self"
  on "public"."medical_reps"
  as permissive
  for insert
  to public
with check ((profile_id = auth.uid()));



  create policy "medical_reps_select_authenticated"
  on "public"."medical_reps"
  as permissive
  for select
  to public
using ((auth.role() = 'authenticated'::text));



  create policy "medical_reps_update_self"
  on "public"."medical_reps"
  as permissive
  for update
  to public
using ((profile_id = auth.uid()))
with check ((profile_id = auth.uid()));



  create policy "meetings_delete_loc_admin_or_admin"
  on "public"."meetings"
  as permissive
  for delete
  to public
using ((public.is_admin() OR public.is_location_admin(location_id)));



  create policy "meetings_insert_rep_or_office"
  on "public"."meetings"
  as permissive
  for insert
  to public
with check (((public.is_admin() OR public.is_location_office_member(location_id) OR public.is_location_rep(location_id)) AND (requested_by_profile_id = auth.uid())));



  create policy "meetings_select_participants_or_admin"
  on "public"."meetings"
  as permissive
  for select
  to public
using ((public.is_admin() OR public.is_location_participant(location_id)));



  create policy "meetings_update_requester_loc_admin_or_admin"
  on "public"."meetings"
  as permissive
  for update
  to public
using ((public.is_admin() OR public.is_location_admin(location_id) OR (requested_by_profile_id = auth.uid())))
with check ((public.is_admin() OR public.is_location_admin(location_id) OR (requested_by_profile_id = auth.uid())));



  create policy "messages_delete_admin_only"
  on "public"."messages"
  as permissive
  for delete
  to public
using (public.is_admin());



  create policy "messages_insert_participants_or_admin"
  on "public"."messages"
  as permissive
  for insert
  to public
with check (((sender_profile_id = auth.uid()) AND (public.is_admin() OR public.is_location_participant(location_id))));



  create policy "messages_select_participants_or_admin"
  on "public"."messages"
  as permissive
  for select
  to public
using ((public.is_admin() OR public.is_location_participant(location_id)));



  create policy "messages_update_recipient_or_admin"
  on "public"."messages"
  as permissive
  for update
  to public
using ((public.is_admin() OR (recipient_profile_id = auth.uid())))
with check ((public.is_admin() OR (recipient_profile_id = auth.uid())));



  create policy "profiles_insert_self"
  on "public"."profiles"
  as permissive
  for insert
  to public
with check (public.is_self(id));



  create policy "profiles_select_authenticated"
  on "public"."profiles"
  as permissive
  for select
  to public
using ((auth.role() = 'authenticated'::text));



  create policy "profiles_update_self"
  on "public"."profiles"
  as permissive
  for update
  to public
using (public.is_self(id))
with check (public.is_self(id));



  create policy "providers_delete_location_admin_or_admin"
  on "public"."providers"
  as permissive
  for delete
  to public
using ((public.is_admin() OR public.is_location_admin(location_id)));



  create policy "providers_insert_location_admin_or_admin"
  on "public"."providers"
  as permissive
  for insert
  to public
with check ((public.is_admin() OR public.is_location_admin(location_id)));



  create policy "providers_select_location_participants_or_admin"
  on "public"."providers"
  as permissive
  for select
  to public
using ((public.is_admin() OR public.is_location_participant(location_id)));



  create policy "providers_update_location_admin_or_admin"
  on "public"."providers"
  as permissive
  for update
  to public
using ((public.is_admin() OR public.is_location_admin(location_id)))
with check ((public.is_admin() OR public.is_location_admin(location_id)));



  create policy "user_roles_delete_location_admin_or_admin"
  on "public"."user_roles"
  as permissive
  for delete
  to public
using ((public.is_admin() OR public.is_location_admin(location_id)));



  create policy "user_roles_insert_location_admin_or_admin"
  on "public"."user_roles"
  as permissive
  for insert
  to public
with check ((public.is_admin() OR public.is_location_admin(location_id)));



  create policy "user_roles_select_self_or_admin"
  on "public"."user_roles"
  as permissive
  for select
  to public
using ((public.is_admin() OR (profile_id = auth.uid())));



  create policy "user_roles_update_location_admin_or_admin"
  on "public"."user_roles"
  as permissive
  for update
  to public
using ((public.is_admin() OR public.is_location_admin(location_id)))
with check ((public.is_admin() OR public.is_location_admin(location_id)));



