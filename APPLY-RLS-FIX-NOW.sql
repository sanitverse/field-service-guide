-- ============================================
-- TASK COMMENTS RLS FIX
-- Copy and paste this entire script into your Supabase SQL Editor
-- ============================================

-- Step 1: Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view comments for accessible tasks" ON task_comments;
DROP POLICY IF EXISTS "Users can create comments for accessible tasks" ON task_comments;
DROP POLICY IF EXISTS "Comment authors can update their comments" ON task_comments;
DROP POLICY IF EXISTS "Comment authors and admins can delete comments" ON task_comments;

-- Step 2: Create new permissive policies

-- Allow authenticated users to view all comments
CREATE POLICY "Authenticated users can view task comments" ON task_comments
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to create comments (as themselves)
CREATE POLICY "Authenticated users can create task comments" ON task_comments
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id);

-- Allow users to update their own comments
CREATE POLICY "Users can update their own comments" ON task_comments
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

-- Allow users to delete their own comments
CREATE POLICY "Users can delete their own comments" ON task_comments
  FOR DELETE
  TO authenticated
  USING (auth.uid() = author_id);

-- Step 3: Verify the policies were created
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE tablename = 'task_comments'
ORDER BY cmd, policyname;
