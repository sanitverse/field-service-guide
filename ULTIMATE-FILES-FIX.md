# 🔥 ULTIMATE FILES UPLOAD FIX

## The Problem
File uploads are failing with RLS policy error even after applying fixes.

## Why Previous Fixes Didn't Work
The policies might not have been created correctly, or there are conflicting policies.

## ✅ GUARANTEED FIX (Choose One)

### Option 1: Complete Reset (RECOMMENDED)

**Run this in Supabase SQL Editor:**

```sql
-- File: FIX-FILES-RLS-COMPLETE.sql
```

Copy the entire contents of `FIX-FILES-RLS-COMPLETE.sql` and run it.

This script will:
1. ✅ Disable RLS temporarily
2. ✅ Remove ALL existing policies
3. ✅ Re-enable RLS
4. ✅ Create fresh, working policies
5. ✅ Verify everything is set up correctly

### Option 2: Temporary Disable (QUICK FIX)

**If you need uploads to work RIGHT NOW:**

```sql
ALTER TABLE files DISABLE ROW LEVEL SECURITY;
```

⚠️ **WARNING**: This removes all security! Only use for testing.

---

## 🔍 Debugging Steps

### 1. Check if you're actually logged in

Open browser console (F12) and run:
```javascript
const { data: { user } } = await supabase.auth.getUser()
console.log('User:', user)
```

Should show your user object with an `id`.

### 2. Check current RLS status

Run in Supabase SQL Editor:
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'files';
```

### 3. Check existing policies

Run in Supabase SQL Editor:
```sql
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'files';
```

### 4. Try manual insert

Run in Supabase SQL Editor (replace YOUR-USER-ID):
```sql
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
```

If this fails, the policies are definitely wrong.

---

## 🎯 Step-by-Step Fix

### Step 1: Open Supabase Dashboard
- Go to: https://supabase.com/dashboard
- Click your project
- Click "SQL Editor"

### Step 2: Run Complete Fix
- Open file: `FIX-FILES-RLS-COMPLETE.sql`
- Copy ALL content
- Paste in SQL Editor
- Click "Run"

### Step 3: Verify Success
You should see output showing:
- 4 policies created
- RLS is enabled
- Status: ✓ RLS is enabled

### Step 4: Test Upload
- Go to your app
- **Hard refresh**: Ctrl+Shift+R (or Cmd+Shift+R on Mac)
- Try uploading a file
- Check browser console for logs

---

## 🐛 Still Not Working?

### Check These:

1. **Are you on the right Supabase project?**
   - Check the URL in your `.env.local`
   - Match it with the dashboard project

2. **Is the user authenticated?**
   ```javascript
   // In browser console
   localStorage.getItem('supabase.auth.token')
   ```
   Should show a token.

3. **Is the uploaded_by field correct?**
   - Check browser console logs
   - Should show: `uploaded_by: [UUID]`

4. **Try disabling RLS temporarily**
   ```sql
   ALTER TABLE files DISABLE ROW LEVEL SECURITY;
   ```
   If this makes it work, the policies are the problem.

---

## 🔧 Nuclear Option

If NOTHING works, run this:

```sql
-- Completely disable RLS
ALTER TABLE files DISABLE ROW LEVEL SECURITY;

-- Drop all policies
DO $$ 
DECLARE r RECORD;
BEGIN
  FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'files') LOOP
    EXECUTE 'DROP POLICY "' || r.policyname || '" ON files';
  END LOOP;
END $$;
```

Then test if uploads work. If they do, we know it's a policy issue.

Then re-enable with simple policies:

```sql
ALTER TABLE files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_all" ON files FOR ALL TO authenticated USING (true) WITH CHECK (true);
```

This allows everything for authenticated users (not secure, but proves it works).

---

## 📞 Need More Help?

Share these outputs:
1. Result of: `SELECT * FROM pg_policies WHERE tablename = 'files';`
2. Result of: `SELECT rowsecurity FROM pg_tables WHERE tablename = 'files';`
3. Browser console logs when uploading
4. Your user ID from: `SELECT auth.uid();`
