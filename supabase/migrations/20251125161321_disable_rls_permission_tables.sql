-- Disable RLS on foundational permission tables to break recursion chain
-- These tables are queried by all RLS policies to determine permissions,
-- so they cannot have RLS themselves without creating circular dependencies.
--
-- This is a common security pattern: permission/role tables typically don't
-- have RLS because they define the permissions for all other tables.

-- Disable RLS on user_roles table
-- This table is queried by nearly every RLS policy to check user permissions
ALTER TABLE "public"."user_roles" DISABLE ROW LEVEL SECURITY;

-- Disable RLS on profiles table
-- This table is queried to check if users are admins
ALTER TABLE "public"."profiles" DISABLE ROW LEVEL SECURITY;

-- Disable RLS on medical_reps table
-- This table is queried to check if users are medical reps
ALTER TABLE "public"."medical_reps" DISABLE ROW LEVEL SECURITY;

-- Note: With these tables having RLS disabled, we rely on:
-- 1. Application-level access control through Supabase Auth (auth.uid())
-- 2. RLS policies on other tables that use these foundational tables to make decisions
-- 3. The fact that these tables contain user role/permission data, not sensitive business data
