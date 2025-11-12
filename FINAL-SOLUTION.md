# FINAL SOLUTION - File Upload RLS Error

## The Error
```
"new row violates row-level security policy for table \"files\""
```

## What This Means
Supabase database is blocking the insert because RLS (Row Level Security) policies are either:
1. Missing
2. Incorrectly configured
3. Not applied

## The ONLY Solution

**You MUST run SQL in Supabase Dashboard.** There is no code fix for this.

---

## Option 1: Check If You Already Ran The Fix

Run this in Supabase SQL Editor:

```sql
-- File: TEST-IF-FIX-APPLIED.sql
SELECT 
  CASE 
    WHEN COUNT(*) = 0 THEN '❌ NO POLICIES - Run RUN-THIS-NOW.sql'
    WHEN COUNT(*) < 4 THEN '⚠️ INCOMPLETE - Only ' || COUNT(*) || ' policies'
    ELSE '✅ COMPLETE - ' || COUNT(*) || ' policies'
  END as status
FROM pg_policies 
WHERE tablename = 'files';
```

### If it says "❌ NO POLICIES":
You haven't run the fix yet. Go to Option 2.

### If it says "✅ COMPLETE":
The policies exist but something else is wrong. Go to Option 3.

---

## Option 2: Apply The Fix (If Policies Don't Exist)

1. Open Supabase Dashboard
2. Go to SQL Editor
3. Copy contents of `RUN-THIS-NOW.sql`
4. Paste and Run
5. Should see 4 policies created

---

## Option 3: Nuclear Option (If Policies Exist But Still Failing)

If policies exist but uploads still fail, there might be a conflict. Run this:

```sql
-- Completely disable RLS (temporary)
ALTER TABLE files DISABLE ROW LEVEL SECURITY;
```

Then test upload. If it works, we know the policies are wrong.

To fix permanently:

```sql
-- Re-enable RLS
ALTER TABLE files ENABLE ROW LEVEL SECURITY;

-- Drop ALL policies
DO $$ 
DECLARE r RECORD;
BEGIN
  FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'files') LOOP
    EXECUTE 'DROP POLICY "' || r.policyname || '" ON files';
  END LOOP;
END $$;

-- Create one simple policy that allows everything for authenticated users
CREATE POLICY "allow_authenticated" ON files 
  FOR ALL 
  TO authenticated 
  USING (true) 
  WITH CHECK (true);
```

This creates ONE policy that allows all operations. Not ideal for production, but will make uploads work.

---

## Option 4: Check User Authentication

The error could also mean the user isn't properly authenticated. Check:

1. Open browser console
2. Run:
```javascript
const { data: { user } } = await supabase.auth.getUser()
console.log('User ID:', user?.id)
```

If `user?.id` is `null` or `undefined`, you're not logged in!

---

## Option 5: Check Supabase Project

Make sure you're running SQL in the CORRECT Supabase project:

1. Check your `.env.local` file
2. Find `NEXT_PUBLIC_SUPABASE_URL`
3. The project ID is in the URL: `https://[PROJECT-ID].supabase.co`
4. Make sure you're in that project in the dashboard

---

## Debugging Checklist

Run these checks:

### 1. Are policies created?
```sql
SELECT COUNT(*) FROM pg_policies WHERE tablename = 'files';
```
Should return 4 (or at least 1)

### 2. Is RLS enabled?
```sql
SELECT rowsecurity FROM pg_tables WHERE tablename = 'files';
```
Should return `true`

### 3. Can you manually insert?
```sql
-- Replace YOUR-USER-ID with your actual user ID
INSERT INTO files (filename, file_path, file_size, mime_type, uploaded_by)
VALUES ('test.txt', 'test.txt', 100, 'text/plain', 'YOUR-USER-ID');
```
If this fails with same error, policies are definitely wrong.

### 4. What's your user ID?
```sql
SELECT auth.uid();
```
Should return a UUID. If NULL, you're not authenticated in SQL Editor.

---

## The Absolute Last Resort

If NOTHING works:

```sql
-- Turn off RLS completely
ALTER TABLE files DISABLE ROW LEVEL SECURITY;
```

This removes all security but will make uploads work. You can then debug the policy issue separately.

---

## Summary

1. ✅ Check if policies exist (`TEST-IF-FIX-APPLIED.sql`)
2. ✅ If no policies, run `RUN-THIS-NOW.sql`
3. ✅ If still failing, disable RLS temporarily
4. ✅ Check you're logged in and in correct project
5. ✅ Try the nuclear option with simple policy

**One of these WILL work.** The error is 100% a database configuration issue, not a code issue.
