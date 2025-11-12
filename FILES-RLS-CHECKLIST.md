# Files RLS Fix Checklist

## ⚠️ The error is still happening because the SQL fix hasn't been applied yet!

Follow this checklist:

## □ Step 1: Open Supabase Dashboard
- [ ] Go to https://supabase.com/dashboard
- [ ] Click on your project
- [ ] Click "SQL Editor" in the left sidebar

## □ Step 2: Check Current State
- [ ] Paste this query in SQL Editor:
```sql
SELECT policyname FROM pg_policies WHERE tablename = 'files';
```
- [ ] Click "Run"
- [ ] Note what policies exist (if any)

## □ Step 3: Apply the Fix
- [ ] Open file: `APPLY-FILES-RLS-FIX.sql`
- [ ] Copy ALL content (Ctrl+A, Ctrl+C)
- [ ] Paste into SQL Editor (Ctrl+V)
- [ ] Click "Run" button
- [ ] Wait for success message

## □ Step 4: Verify Fix Applied
- [ ] Run this query:
```sql
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'files';
```
- [ ] Should see 4 policies:
  - [ ] Authenticated users can view files (SELECT)
  - [ ] Authenticated users can upload files (INSERT)
  - [ ] Users can update their own files (UPDATE)
  - [ ] Users can delete their own files (DELETE)

## □ Step 5: Test Upload
- [ ] Go back to your application
- [ ] Refresh the page (F5)
- [ ] Try uploading a file
- [ ] Should work without 403 error! ✅

---

## ❓ Still Not Working?

### Check These:

1. **Did you run the SQL in the correct project?**
   - Check the project name in Supabase dashboard
   - Make sure it matches your app's Supabase URL

2. **Did the SQL run successfully?**
   - Look for green success message
   - No red error messages

3. **Are you logged in?**
   - Check browser console (F12)
   - Type: `localStorage.getItem('supabase.auth.token')`
   - Should show a token

4. **Did you refresh the page?**
   - After applying SQL fix
   - Press F5 or Ctrl+R

---

## 🎯 Quick Summary

**The Problem:** RLS policies are blocking file uploads

**The Solution:** Run `APPLY-FILES-RLS-FIX.sql` in Supabase SQL Editor

**The Result:** Files upload successfully ✅

---

## 📝 Files You Need

1. **`APPLY-FILES-RLS-FIX.sql`** ← Run this in Supabase
2. **`CHECK-FILES-RLS.sql`** ← Use this to verify
3. **`STEP-BY-STEP-FIX-FILES.md`** ← Detailed instructions

---

## ⏱️ Time Required

- **2 minutes** to apply the fix
- **30 seconds** to test

**Total: 2.5 minutes** to fix the issue completely!
