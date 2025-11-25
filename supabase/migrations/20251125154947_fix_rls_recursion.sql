-- Fix RLS recursion issue by making is_location_rep function use SECURITY DEFINER
-- This prevents infinite recursion when medical_rep_locations RLS policy calls is_location_participant
-- which in turn calls is_location_rep that queries medical_rep_locations

CREATE OR REPLACE FUNCTION public.is_location_rep(loc_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE
 SECURITY DEFINER  -- This allows the function to bypass RLS when querying medical_rep_locations
 SET search_path TO 'public'
AS $function$
  select exists (
    select 1
    from public.medical_reps mr
    join public.medical_rep_locations mrl
      on mr.id = mrl.medical_rep_id
    where mr.profile_id = auth.uid()
      and mrl.location_id = loc_id
      and mr.status = 'active'
      and mrl.relationship_status = 'active'
  );
$function$;
