-- Break the RLS recursion cycle by allowing all authenticated users to read medical_rep_locations
-- This prevents recursion when other tables' RLS policies query medical_rep_locations

-- Drop all existing SELECT policies on medical_rep_locations
DROP POLICY IF EXISTS "mrl_select_inline" ON "public"."medical_rep_locations";
DROP POLICY IF EXISTS "mrl_select_simple" ON "public"."medical_rep_locations";
DROP POLICY IF EXISTS "mrl_select_participants_or_admin" ON "public"."medical_rep_locations";

-- Create a simple policy that allows all authenticated users to SELECT
-- This breaks the recursion cycle while still keeping RLS enabled on the table
CREATE POLICY "mrl_select_authenticated"
ON "public"."medical_rep_locations"
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (true);
