-- ============================================
-- FILES TABLE RLS FIX
-- Copy and paste this entire script into your Supabase SQL Editor
-- ============================================

-- Step 1: Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view their own files" ON files;
DROP POLICY IF EXISTS "Users can upload files" ON files;
DROP POLICY IF EXISTS "Users can update their own files" ON files;
DROP POLICY IF EXISTS "Users can delete their own files" ON files;
DROP POLICY IF EXISTS "System can insert files" ON files;
DROP POLICY IF EXISTS "System can update files" ON files;

-- Step 2: Create new permissive policies

-- Allow authenticated users to view all files
CREATE POLICY "Authenticated users can view files" ON files
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to upload files (as themselves)
CREATE POLICY "Authenticated users can upload files" ON files
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = uploaded_by);

-- Allow users to update their own files
CREATE POLICY "Users can update their own files" ON files
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = uploaded_by)
  WITH CHECK (auth.uid() = uploaded_by);

-- Allow users to delete their own files
CREATE POLICY "Users can delete their own files" ON files
  FOR DELETE
  TO authenticated
  USING (auth.uid() = uploaded_by);

-- Step 3: Verify the policies were created
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE tablename = 'files'
ORDER BY cmd, policyname;
