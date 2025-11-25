-- Redesign RLS policies to eliminate recursion by using inline permission checks
-- instead of calling helper functions that create circular dependencies

-- ==============================================================================
-- MEDICAL_REP_LOCATIONS TABLE
-- ==============================================================================

-- Drop existing policies that cause recursion
DROP POLICY IF EXISTS "mrl_select_simple" ON "public"."medical_rep_locations";
DROP POLICY IF EXISTS "mrl_select_participants_or_admin" ON "public"."medical_rep_locations";

-- Create new SELECT policy with inline checks (no function calls)
CREATE POLICY "mrl_select_inline"
ON "public"."medical_rep_locations"
AS PERMISSIVE
FOR SELECT
TO PUBLIC
USING (
  -- Allow if user is an admin
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
  )
  OR
  -- Allow if user is a location admin for this location
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.profile_id = auth.uid()
      AND user_roles.location_id = medical_rep_locations.location_id
      AND user_roles.role = 'location_admin'
      AND user_roles.status = 'active'
  )
  OR
  -- Allow if this is the user's own medical_rep record
  EXISTS (
    SELECT 1 FROM public.medical_reps
    WHERE medical_reps.id = medical_rep_locations.medical_rep_id
      AND medical_reps.profile_id = auth.uid()
      AND medical_reps.status = 'active'
  )
);

-- ==============================================================================
-- PROVIDERS TABLE
-- ==============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "providers_select_participants_or_admin" ON "public"."providers";

-- Create new SELECT policy with inline checks
CREATE POLICY "providers_select_inline"
ON "public"."providers"
AS PERMISSIVE
FOR SELECT
TO PUBLIC
USING (
  -- Allow if user is an admin
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
  )
  OR
  -- Allow if user is an office member at this location
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.profile_id = auth.uid()
      AND user_roles.location_id = providers.location_id
      AND user_roles.role IN ('office_staff', 'location_admin', 'scheduler')
      AND user_roles.status = 'active'
  )
  OR
  -- Allow if user is a medical rep with access to this location
  EXISTS (
    SELECT 1 
    FROM public.medical_reps mr
    JOIN public.medical_rep_locations mrl ON mr.id = mrl.medical_rep_id
    WHERE mr.profile_id = auth.uid()
      AND mrl.location_id = providers.location_id
      AND mr.status = 'active'
      AND mrl.relationship_status = 'active'
  )
);

-- ==============================================================================
-- LOCATION_PREFERRED_TIME_SLOTS TABLE
-- ==============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "slots_select_participants_or_admin" ON "public"."location_preferred_time_slots";

-- Create new SELECT policy with inline checks
CREATE POLICY "slots_select_inline"
ON "public"."location_preferred_time_slots"
AS PERMISSIVE
FOR SELECT
TO PUBLIC
USING (
  -- Allow if user is an admin
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
  )
  OR
  -- Allow if user is an office member at this location
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.profile_id = auth.uid()
      AND user_roles.location_id = location_preferred_time_slots.location_id
      AND user_roles.role IN ('office_staff', 'location_admin', 'scheduler')
      AND user_roles.status = 'active'
  )
  OR
  -- Allow if user is a medical rep with access to this location
  EXISTS (
    SELECT 1 
    FROM public.medical_reps mr
    JOIN public.medical_rep_locations mrl ON mr.id = mrl.medical_rep_id
    WHERE mr.profile_id = auth.uid()
      AND mrl.location_id = location_preferred_time_slots.location_id
      AND mr.status = 'active'
      AND mrl.relationship_status = 'active'
  )
);
