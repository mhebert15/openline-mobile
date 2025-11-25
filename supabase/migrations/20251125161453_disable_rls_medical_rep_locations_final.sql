-- Disable RLS on medical_rep_locations table to break the final recursion chain
-- This table links medical reps to locations and is queried by many RLS policies
-- Similar to user_roles and profiles, this is a foundational permission table
-- that should not have RLS enabled

ALTER TABLE "public"."medical_rep_locations" DISABLE ROW LEVEL SECURITY;

-- Note: With this change, all foundational permission/relationship tables now have RLS disabled:
-- - user_roles (defines user roles per location)
-- - profiles (defines user types including admins)
-- - medical_reps (defines medical rep profiles)
-- - medical_rep_locations (defines which locations each medical rep can access)
--
-- These tables are used to determine permissions for all other tables,
-- so they cannot have RLS themselves without creating circular dependencies.
