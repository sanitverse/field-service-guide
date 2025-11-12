# Step-by-Step: Fix Files Upload RLS Error

## Current Error
```
XHR POST https://[your-supabase]/rest/v1/files
HTTP/2 403
code: "42501"
message: 'new row violates row-level security policy for table "files"'
```

## Step 1: Check Current Policies

1. Open Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Click **SQL Editor** in the left sidebar
4. Copy and paste this query:

```sql
SELECT 
  policyname,
  cmd
FROM pg_policies
WHERE tablename = 'files'
ORDER BY cmd, policyname;
```

5. Click **Run**
6. **What you'll see**: Either no policies, or old restrictive policies

---

## Step 2: Apply the Fix

1. **Stay in SQL Editor**
2. **Clear the editor** (delete the check query)
3. **Open the file**: `APPLY-FILES-RLS-FIX.sql` from your project
4. **Copy ALL the content** (Ctrl+A, Ctrl+C)
5. **Paste into SQL Editor** (Ctrl+V)
6. **Click Run** (or press Ctrl+Enter)

### Expected Result:
You should see messages like:
```
DROP POLICY
DROP POLICY
...
CREATE POLICY
CREATE POLICY
...
```

And finally a table showing:
```
policyname                              | cmd
----------------------------------------|--------
Authenticated users can view files      | SELECT
Authenticated users can upload files    | INSERT
Users can update their own files        | UPDATE
Users can delete their own files        | DELETE
```

---

## Step 3: Verify the Fix

1. **Stay in SQL Editor**
2. **Run the check query again**:

```sql
SELECT 
  policyname,
  cmd
FROM pg_policies
WHERE tablename = 'files'
ORDER BY cmd, policyname;
```

3. **You should see 4 policies**:
   - Authenticated users can view files (SELECT)
   - Authenticated users can upload files (INSERT)
   - Users can update their own files (UPDATE)
   - Users can delete their own files (DELETE)

---

## Step 4: Test File Upload

1. **Go back to your application**
2. **Refresh the page** (F5 or Ctrl+R)
3. **Navigate to File Management**
4. **Click "Upload Files"**
5. **Select a file**
6. **Click "Upload"**

### Expected Result:
✅ File uploads successfully
✅ No 403 error
✅ File appears in the list

---

## Troubleshooting

### If you still get the error:

1. **Check you're logged in**
   - Open browser console (F12)
   - Type: `localStorage.getItem('supabase.auth.token')`
   - Should show a token

2. **Check the policies were created**
   - Run the verification query from Step 3
   - Should see 4 policies

3. **Check RLS is enabled**
   ```sql
   SELECT tablename, rowsecurity 
   FROM pg_tables 
   WHERE tablename = 'files';
   ```
   - `rowsecurity` should be `true`

4. **Clear browser cache**
   - Press Ctrl+Shift+Delete
   - Clear cached data
   - Refresh page

5. **Check user ID matches**
   - In browser console: `console.log(user.id)`
   - Should show a UUID

### If policies don't exist after running the fix:

1. **Check for errors in SQL Editor**
   - Look for red error messages
   - Common issue: syntax errors from copy/paste

2. **Try running policies one at a time**
   - Copy just the DROP POLICY statements
   - Run them
   - Then copy just the CREATE POLICY statements
   - Run them

3. **Check permissions**
   - Make sure you're using the correct Supabase project
   - Make sure you have admin access

---

## Quick Test Query

After applying the fix, test if you can insert:

```sql
-- This should work if policies are correct
-- Replace 'YOUR-USER-ID' with your actual user ID
INSERT INTO files (
  filename,
  file_path,
  file_size,
  mime_type,
  uploaded_by
) VALUES (
  'test.txt',
  'test/test.txt',
  100,
  'text/plain',
  'YOUR-USER-ID'
);

-- Then delete the test record
DELETE FROM files WHERE filename = 'test.txt';
```

If this works, your policies are correct!

---

## Need Help?

If you're still having issues:
1. Run `CHECK-FILES-RLS.sql` and share the output
2. Check browser console for any other errors
3. Verify you're on the correct Supabase project
