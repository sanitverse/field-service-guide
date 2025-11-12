-- Fix task_comments RLS policies to allow authenticated users to create comments
-- Run this script directly against your Supabase database

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view comments for accessible tasks" ON task_comments;
DROP POLICY IF EXISTS "Users can create comments for accessible tasks" ON task_comments;
DROP POLICY IF EXISTS "Comment authors can update their comments" ON task_comments;
DROP POLICY IF EXISTS "Comment authors and admins can delete comments" ON task_comments;

-- Create simpler, more permissive policies for task_comments

-- Allow authenticated users to view all comments
CREATE POLICY "Authenticated users can view task comments" ON task_comments
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to create comments on any task
CREATE POLICY "Authenticated users can create task comments" ON task_comments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = author_id
  );

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

-- Verify the policies were created
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'task_comments'
ORDER BY cmd, policyname;