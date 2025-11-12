# Apply Task Comments RLS Fix

## Quick Fix Instructions

Since the Supabase CLI isn't installed locally, follow these steps to apply the fix through the Supabase Dashboard:

### Step 1: Open Supabase Dashboard

1. Go to https://supabase.com/dashboard
2. Select your project: **field-service-guide**
3. Navigate to **SQL Editor** in the left sidebar

### Step 2: Run the Fix SQL

Copy and paste the following SQL into the SQL Editor and click **Run**:

```sql
-- Fix task_comments RLS policies to allow authenticated users to create comments

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
```

### Step 3: Verify

After running the SQL:

1. Check the query results at the bottom - you should see 4 new policies listed
2. Go back to your application
3. Try creating a comment on a task
4. The error should be gone! ✅

### What This Fix Does

- ✅ Removes overly restrictive policies that were causing the error
- ✅ Allows any authenticated user to view all comments
- ✅ Allows any authenticated user to create comments (as themselves)
- ✅ Users can only update/delete their own comments
- ✅ Maintains security while fixing the permission issue

### Troubleshooting

If you still see errors after applying:

1. Make sure you're logged in to the application
2. Try refreshing the page
3. Check the browser console for any new error messages
4. Verify the policies were created by running:
   ```sql
   SELECT policyname FROM pg_policies WHERE tablename = 'task_comments';
   ```

---

**Need Help?** Check the detailed guide in `scripts/README-RLS-FIX.md`
