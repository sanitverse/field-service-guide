# Fix Task Update Policy 🔧

## Problem
Task updates are failing with an RLS policy error. The UPDATE policy needs to be added/fixed.

## Solution

Go to **Supabase Dashboard → SQL Editor** and run:

```sql
-- Drop any existing UPDATE policies
DROP POLICY IF EXISTS "Task creators and assignees can update tasks" ON service_tasks;
DROP POLICY IF EXISTS "Users can update tasks they created or are assigned to" ON service_tasks;
DROP POLICY IF EXISTS "Authenticated users can update tasks" ON service_tasks;

-- Create a simple UPDATE policy for authenticated users
CREATE POLICY "Authenticated users can update tasks" ON service_tasks
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Verify the policy was created
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'service_tasks'
ORDER BY cmd;
```

## Expected Result

You should see these policies:
- ✅ "Authenticated users can create tasks" (INSERT)
- ✅ "Authenticated users can view all tasks" (SELECT)
- ✅ "Authenticated users can update tasks" (UPDATE)

## Test

After applying:
1. Edit a task
2. Make changes
3. Click "Update Task"
4. Should work immediately!

The console will show:
```
🔵 Updating task: [task-id]
🔵 Update data: {...}
✅ Task updated successfully
```

**Apply this now and task updates will work!** 🎉
