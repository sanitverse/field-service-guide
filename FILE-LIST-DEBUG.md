# File List Not Showing - Debug Guide

## Issue
Files are uploading successfully but not appearing in the File Management page.

## Changes Made
Added comprehensive logging to track the file fetching process:

### 1. Database Layer (`lib/database.ts`)
- ✅ Added logging when fetching files
- ✅ Logs the number of files found
- ✅ Logs any errors with details

### 2. Component Layer (`components/files/file-browser.tsx`)
- ✅ Added logging when loading files
- ✅ Logs API response
- ✅ Logs number of files being set

## How to Debug

### Step 1: Open Browser Console
1. Go to File Management page
2. Press F12 to open Developer Tools
3. Click on "Console" tab

### Step 2: Refresh the Page
Press F5 or Ctrl+R to reload

### Step 3: Check Console Logs
You should see logs like:
```
🔄 Loading files...
📡 Fetching from API: /api/files?
📂 Fetching files... {taskId: undefined}
✅ Files fetched: X
📥 API Response: {ok: true, status: 200, data: {...}}
✅ Setting files: X files
```

## Possible Issues & Solutions

### Issue 1: API Returns 0 Files
**Logs show**: `✅ Files fetched: 0`

**Cause**: No files in database OR RLS policy blocking SELECT

**Solution**: Check if files exist in database:
```sql
SELECT COUNT(*) FROM files;
```

If count > 0 but API returns 0, it's an RLS issue.

### Issue 2: RLS Policy Error
**Logs show**: `❌ Error fetching files: {...}`

**Cause**: SELECT policy missing or incorrect

**Solution**: Run in Supabase SQL Editor:
```sql
-- Check if SELECT policy exists
SELECT policyname FROM pg_policies 
WHERE tablename = 'files' AND cmd = 'SELECT';
```

Should show: `files_select`

If missing, run `RUN-THIS-NOW.sql` again.

### Issue 3: Profile Join Failing
**Logs show**: Error about profiles table

**Cause**: RLS on profiles table blocking the join

**Solution**: Simplify the query temporarily:
```typescript
// In lib/database.ts, change:
.select(`
  *,
  uploader:uploaded_by(id, full_name, email)
`)

// To:
.select('*')
```

This removes the profile join to test if that's the issue.

### Issue 4: Files Array Empty in Component
**Logs show**: `✅ Setting files: 0 files` but database has files

**Cause**: API response structure issue

**Solution**: Check API response format in console. Should be:
```json
{
  "success": true,
  "files": [...],
  "count": X
}
```

## Quick Test

Run this in Supabase SQL Editor to check if files exist:
```sql
SELECT 
  id,
  filename,
  uploaded_by,
  created_at
FROM files
ORDER BY created_at DESC
LIMIT 10;
```

If you see files here but not in the app, it's an RLS or API issue.

## Next Steps

1. ✅ Refresh the File Management page
2. ✅ Open browser console (F12)
3. ✅ Look for the logs mentioned above
4. ✅ Share the console output if files still don't show

The logs will tell us exactly where the issue is!
