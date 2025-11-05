-- Fix RLS policies for service_tasks table
-- Run this in Supabase SQL Editor if RLS is blocking task creation

-- Enable RLS on service_tasks (if not already enabled)
ALTER TABLE service_tasks ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view tasks" ON service_tasks;
DROP POLICY IF EXISTS "Users can create tasks" ON service_tasks;
DROP POLICY IF EXISTS "Users can update their tasks" ON service_tasks;
DROP POLICY IF EXISTS "Users can delete their tasks" ON service_tasks;

-- Policy 1: Allow authenticated users to view all tasks
CREATE POLICY "Users can view tasks"
ON service_tasks
FOR SELECT
TO authenticated
USING (true);

-- Policy 2: Allow authenticated users to create tasks
-- They must set themselves as the creator
CREATE POLICY "Users can create tasks"
ON service_tasks
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by);

-- Policy 3: Allow users to update tasks they created or are assigned to
CREATE POLICY "Users can update their tasks"
ON service_tasks
FOR UPDATE
TO authenticated
USING (
  auth.uid() = created_by 
  OR auth.uid() = assigned_to
  OR EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'supervisor')
  )
);

-- Policy 4: Allow users to delete tasks they created (or admins)
CREATE POLICY "Users can delete their tasks"
ON service_tasks
FOR DELETE
TO authenticated
USING (
  auth.uid() = created_by
  OR EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Verify policies were created
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'service_tasks'
ORDER BY policyname;
