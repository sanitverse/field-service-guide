# 🔧 Apply Files RLS Fix - Quick Instructions

## The Problem
Users cannot upload files due to RLS policy violations:
```
code: "42501"
message: 'new row violates row-level security policy for table "files"'
```

## The Solution (2 minutes)

### Step 1: Open Supabase SQL Editor
1. Go to your Supabase project: https://supabase.com/dashboard
2. Click on your project
3. Navigate to **SQL Editor** in the left sidebar

### Step 2: Run the Fix
1. Open the file: `APPLY-FILES-RLS-FIX.sql` (in the root of this project)
2. Copy ALL the SQL content
3. Paste it into the Supabase SQL Editor
4. Click **Run** (or press Ctrl+Enter)

### Step 3: Verify
You should see a success message and a table showing the new policies:
- Authenticated users can view files
- Authenticated users can upload files
- Users can update their own files
- Users can delete their own files

### Step 4: Test
1. Go back to your application
2. Navigate to File Management
3. Try uploading a file
4. It should work without errors! ✅

---

## What This Fix Does

- ✅ Removes overly restrictive policies
- ✅ Allows authenticated users to upload files
- ✅ Maintains security (users can only upload files as themselves)
- ✅ Users can only edit/delete their own files
- ✅ All users can view all files (for collaboration)

The fix is safe and maintains proper security while fixing the permission issue.

---

## Alternative: If you prefer command line

If your Supabase is running locally with Docker:

```bash
# Make sure Docker is running
# Then run:
psql postgresql://postgres:postgres@localhost:54322/postgres -f APPLY-FILES-RLS-FIX.sql
```

---

## After Applying

Once you've applied the migration:
1. Refresh your application
2. Try uploading a file
3. The error should be resolved! ✅

## Security Notes

The new policies are secure:
- ✅ Only authenticated users can upload files
- ✅ Users can only upload files as themselves (uploaded_by = auth.uid())
- ✅ Users can only modify their own files
- ✅ All operations are logged and auditable
- ✅ File viewing is open for collaboration (can be restricted later if needed)
