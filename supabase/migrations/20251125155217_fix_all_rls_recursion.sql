-- Comprehensive fix for RLS recursion by adding SECURITY DEFINER to all security helper functions
-- This allows these functions to bypass RLS when checking permissions, breaking the recursion cycle

-- Fix is_location_participant to use SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.is_location_participant(loc_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE
 SECURITY DEFINER  -- Bypass RLS when checking participation
 SET search_path TO 'public'
AS $function$
  select public.is_location_office_member(loc_id)
      or public.is_location_rep(loc_id);
$function$;

-- Fix is_location_office_member to use SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.is_location_office_member(loc_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE
 SECURITY DEFINER  -- Bypass RLS when checking office membership
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
$function$;

-- Fix is_location_admin to use SECURITY DEFINER  
CREATE OR REPLACE FUNCTION public.is_location_admin(loc_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE
 SECURITY DEFINER  -- Bypass RLS when checking admin status
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
$function$;
