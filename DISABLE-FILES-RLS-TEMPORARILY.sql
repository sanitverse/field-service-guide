-- TEMPORARY FIX: Disable RLS on files table
-- This will allow uploads to work immediately
-- WARNING: This removes all access restrictions temporarily

-- Disable RLS on files table
ALTER TABLE files DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'files';

-- This should show rls_enabled = false
