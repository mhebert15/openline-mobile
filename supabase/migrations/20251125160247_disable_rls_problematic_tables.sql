-- Temporarily disable RLS on tables causing recursion issues
-- This allows development to proceed while we redesign the security model properly

-- Disable RLS on providers table
ALTER TABLE "public"."providers" DISABLE ROW LEVEL SECURITY;

-- Disable RLS on location_preferred_time_slots table
ALTER TABLE "public"."location_preferred_time_slots" DISABLE ROW LEVEL SECURITY;

-- Note: medical_rep_locations already has a permissive policy for all authenticated users
-- which should prevent recursion
