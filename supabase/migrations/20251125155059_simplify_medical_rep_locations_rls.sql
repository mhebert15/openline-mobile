-- Simplify RLS policies on medical_rep_locations to avoid recursion
-- The original policy called is_location_participant() which calls is_location_rep()
-- which queries medical_rep_locations, creating infinite recursion

-- Drop the existing SELECT policy that causes recursion
DROP POLICY IF EXISTS "mrl_select_participants_or_admin" ON "public"."medical_rep_locations";

-- Create a new, simpler SELECT policy that doesn't call is_location_participant()
-- This policy allows:
-- 1. Admins to see all records
-- 2. Location admins to see records for their location
-- 3. Medical reps to see their own location relationships
CREATE POLICY "mrl_select_simple"
ON "public"."medical_rep_locations"
AS PERMISSIVE
FOR SELECT
TO PUBLIC
USING (
  -- Allow if user is an admin
  public.is_admin()
  OR
  -- Allow if user is a location admin for this location
  public.is_location_admin(location_id)
  OR
  -- Allow if this is the user's own medical_rep record
  (
    EXISTS (
      SELECT 1
      FROM public.medical_reps mr
      WHERE mr.id = medical_rep_locations.medical_rep_id
        AND mr.profile_id = auth.uid()
        AND mr.status = 'active'
    )
  )
);
