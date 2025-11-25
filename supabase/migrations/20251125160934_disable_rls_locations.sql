-- Disable RLS on locations table to break recursion chain
-- The locations table queries were the source of the recursion

ALTER TABLE "public"."locations" DISABLE ROW LEVEL SECURITY;
