-- COMPLETE FIX FOR FILES RLS
-- Run this entire script in Supabase SQL Editor

-- Step 1: Disable RLS temporarily
ALTER TABLE files DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop ALL existing policies (if any)
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'files') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON files';
    END LOOP;
END $$;

-- Step 3: Re-enable RLS
ALTER TABLE files ENABLE ROW LEVEL SECURITY;

-- Step 4: Create new simple policies

-- Allow authenticated users to view all files
CREATE POLICY "files_select_policy" ON files
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to insert files (as themselves)
CREATE POLICY "files_insert_policy" ON files
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = uploaded_by);

-- Allow users to update their own files
CREATE POLICY "files_update_policy" ON files
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = uploaded_by)
  WITH CHECK (auth.uid() = uploaded_by);

-- Allow users to delete their own files  
CREATE POLICY "files_delete_policy" ON files
  FOR DELETE
  TO authenticated
  USING (auth.uid() = uploaded_by);

-- Step 5: Verify policies were created
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  CASE 
    WHEN cmd = 'SELECT' THEN 'View files'
    WHEN cmd = 'INSERT' THEN 'Upload files'
    WHEN cmd = 'UPDATE' THEN 'Update own files'
    WHEN cmd = 'DELETE' THEN 'Delete own files'
  END as description
FROM pg_policies
WHERE tablename = 'files'
ORDER BY cmd;

-- Step 6: Test if RLS is working
SELECT 
  tablename,
  rowsecurity as rls_enabled,
  CASE 
    WHEN rowsecurity THEN '✓ RLS is enabled'
    ELSE '✗ RLS is disabled'
  END as status
FROM pg_tables
WHERE tablename = 'files';
