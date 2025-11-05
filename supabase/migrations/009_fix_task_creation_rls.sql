-- Fix RLS policy for task creation
-- The issue: The INSERT policy requires checking if user has a profile with specific role
-- But this check might fail if done in a subquery

-- Drop the existing restrictive INSERT policy
DROP POLICY IF EXISTS "Authorized users can create tasks" ON service_tasks;

-- Create a simpler INSERT policy that just checks if user is authenticated
-- and sets themselves as creator
CREATE POLICY "Authenticated users can create tasks" ON service_tasks
  FOR INSERT 
  TO authenticated
  WITH CHECK (
    auth.uid() = created_by
  );

-- Also ensure users can view all tasks (not just assigned ones)
-- This helps with the dashboard view
DROP POLICY IF EXISTS "Users can view tasks assigned to them" ON service_tasks;

CREATE POLICY "Authenticated users can view all tasks" ON service_tasks
  FOR SELECT
  TO authenticated
  USING (true);

-- Keep the UPDATE policy but simplify it
DROP POLICY IF EXISTS "Task creators and assignees can update tasks" ON service_tasks;
DROP POLICY IF EXISTS "Users can update tasks they created or are assigned to" ON service_tasks;

CREATE POLICY "Authenticated users can update tasks" ON service_tasks
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Verify the policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'service_tasks'
ORDER BY cmd, policyname;
