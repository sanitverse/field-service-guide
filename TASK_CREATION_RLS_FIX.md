# Task Creation RLS Policy Fix 🔐

## Problem
Task creation is failing at the INSERT step. This is most likely due to Row Level Security (RLS) policies blocking the insert operation.

## Quick Diagnosis

### Check Browser Console
Look for these lines after "❌ Insert error:":
- **Error message**: The actual error description
- **Error code**: Usually `42501` for permission denied
- **Error hint**: Suggestions from Supabase

### Common Error Messages:
1. **"new row violates row-level security policy"** → RLS blocking insert
2. **"permission denied for table service_tasks"** → No INSERT policy
3. **"null value in column violates not-null constraint"** → Missing required field

## Solution 1: Check RLS Policies

Run the diagnostic script:
```bash
node scripts/check-rls-policies.js
```

This will:
- ✅ Test if service role can insert (bypasses RLS)
- ✅ Show if RLS is the issue
- ✅ Provide recommendations

## Solution 2: Fix RLS Policies

### Option A: Using Supabase Dashboard

1. **Go to Supabase Dashboard**
   - Navigate to your project
   - Click on "Authentication" → "Policies"

2. **Find service_tasks table**
   - Look for the `service_tasks` table
   - Check if RLS is enabled

3. **Add INSERT Policy**
   - Click "New Policy"
   - Choose "Create a policy from scratch"
   - Fill in:
     - **Policy name**: `Users can create tasks`
     - **Command**: `INSERT`
     - **Target roles**: `authenticated`
     - **WITH CHECK expression**: `auth.uid() = created_by`

4. **Save the policy**

### Option B: Using SQL Editor

1. **Go to SQL Editor** in Supabase Dashboard

2. **Run the fix script**:
   ```sql
   -- Copy and paste the contents of scripts/fix-task-rls-policy.sql
   ```

3. **Or run this quick fix**:
   ```sql
   -- Enable RLS
   ALTER TABLE service_tasks ENABLE ROW LEVEL SECURITY;

   -- Allow authenticated users to create tasks
   CREATE POLICY "Users can create tasks"
   ON service_tasks
   FOR INSERT
   TO authenticated
   WITH CHECK (auth.uid() = created_by);

   -- Allow authenticated users to view all tasks
   CREATE POLICY "Users can view tasks"
   ON service_tasks
   FOR SELECT
   TO authenticated
   USING (true);
   ```

## Solution 3: Temporary Workaround (Development Only)

If you need to test quickly, you can temporarily disable RLS:

```sql
-- ⚠️ DEVELOPMENT ONLY - DO NOT USE IN PRODUCTION
ALTER TABLE service_tasks DISABLE ROW LEVEL SECURITY;
```

**Warning**: This removes all security! Only use for local development.

## Recommended RLS Policies

### Complete Policy Set:

```sql
-- 1. SELECT: Allow all authenticated users to view tasks
CREATE POLICY "Users can view tasks"
ON service_tasks FOR SELECT
TO authenticated
USING (true);

-- 2. INSERT: Allow users to create tasks (must be creator)
CREATE POLICY "Users can create tasks"
ON service_tasks FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by);

-- 3. UPDATE: Allow creators, assignees, and admins to update
CREATE POLICY "Users can update their tasks"
ON service_tasks FOR UPDATE
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

-- 4. DELETE: Allow creators and admins to delete
CREATE POLICY "Users can delete their tasks"
ON service_tasks FOR DELETE
TO authenticated
USING (
  auth.uid() = created_by
  OR EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);
```

## Verification

After applying the fix:

1. **Check policies exist**:
   ```sql
   SELECT policyname, cmd 
   FROM pg_policies 
   WHERE tablename = 'service_tasks';
   ```

2. **Try creating a task** in the UI

3. **Check console** - should see:
   ```
   🔵 Step 1: Inserting task...
   ✅ Task inserted successfully: [task-id]
   🔵 Step 2: Fetching task with relations...
   ✅ Task created successfully with relations
   ```

## Troubleshooting

### Still Getting Errors?

1. **Check user authentication**:
   - Is the user logged in?
   - Is `auth.uid()` returning a value?
   - Does the user have a profile?

2. **Check created_by field**:
   - Is it being set correctly?
   - Does it match `auth.uid()`?

3. **Check other constraints**:
   - Are all required fields present?
   - Are enum values valid?
   - Are foreign keys valid?

### Debug Queries

```sql
-- Check if user is authenticated
SELECT auth.uid();

-- Check user's profile
SELECT * FROM profiles WHERE id = auth.uid();

-- Check existing policies
SELECT * FROM pg_policies WHERE tablename = 'service_tasks';

-- Test insert manually
INSERT INTO service_tasks (
  title, 
  description, 
  priority, 
  status, 
  created_by
) VALUES (
  'Test Task',
  'Testing',
  'medium',
  'pending',
  auth.uid()
);
```

## Files Created

1. **scripts/check-rls-policies.js** - Diagnostic script
2. **scripts/fix-task-rls-policy.sql** - SQL fix script

## Next Steps

1. Run the diagnostic script
2. Apply the RLS policy fix
3. Try creating a task
4. Check browser console for success messages

The RLS policies should now allow authenticated users to create tasks!
