# Task Creation Debug Guide 🔍

## Current Issue
Task creation is failing with an empty error object `{}`, making it difficult to diagnose the root cause.

## Enhanced Debugging Applied

### 1. Comprehensive Error Logging
Added multiple layers of error logging in `lib/database.ts`:

```typescript
- console.log('Creating task with data:', JSON.stringify(task, null, 2))
- console.log('Supabase client exists:', !!supabase)
- console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
- console.error('Supabase error creating task:')
- console.error('Error object:', error)
- console.error('Error stringified:', JSON.stringify(error, null, 2))
- console.error('Error message:', error?.message)
- console.error('Error details:', error?.details)
- console.error('Error hint:', error?.hint)
- console.error('Error code:', error?.code)
```

### 2. Try-Catch Wrapper
Wrapped the entire function in try-catch to catch any exceptions:

```typescript
try {
  // ... database operations
} catch (err) {
  console.error('Exception in createTask:', err)
  console.error('Exception stringified:', JSON.stringify(err, null, 2))
  return null
}
```

### 3. Test Script Created
Created `scripts/test-task-creation-debug.js` to test task creation independently.

## Debugging Steps

### Step 1: Check Browser Console
When you try to create a task, check the browser console for:

1. **"Creating task with data:"** - Shows what data is being sent
2. **"Supabase client exists:"** - Confirms Supabase is initialized
3. **"Supabase URL:"** - Shows the Supabase URL being used
4. **Error logs** - Multiple error logs with different formats

### Step 2: Run Test Script
Run the test script to verify database connection:

```bash
node scripts/test-task-creation-debug.js
```

This will:
- ✅ Test Supabase connection
- ✅ Fetch a test user
- ✅ Try to create a task
- ✅ Show detailed error information if it fails
- ✅ Clean up test data

### Step 3: Check Console Output
Look for these specific outputs:

**If Successful:**
```
✅ Connected to Supabase
✅ Task created successfully!
✅ Test task deleted
✅ All tests passed!
```

**If Failed:**
```
❌ Task creation error:
   Error message: [actual error message]
   Error details: [error details]
   Error hint: [helpful hint]
   Error code: [error code]
```

## Common Issues & Solutions

### Issue 1: Empty Error Object
**Symptom:** Error object shows as `{}`

**Possible Causes:**
1. Network error before reaching Supabase
2. CORS issue
3. Invalid Supabase URL/key
4. Browser blocking the request

**Solution:** Check browser Network tab for failed requests

### Issue 2: Authentication Error
**Symptom:** Error code: `401` or `403`

**Possible Causes:**
1. User not authenticated
2. Invalid JWT token
3. RLS policies blocking the insert

**Solution:** 
- Check if user is logged in
- Verify RLS policies allow insert
- Check token expiration

### Issue 3: Validation Error
**Symptom:** Error code: `23514` or `23502`

**Possible Causes:**
1. Missing required field
2. Invalid enum value
3. Foreign key constraint violation

**Solution:**
- Check all required fields are present
- Verify enum values match database constraints
- Ensure referenced IDs exist

### Issue 4: Permission Error
**Symptom:** Error message contains "permission denied"

**Possible Causes:**
1. RLS policies too restrictive
2. User doesn't have insert permission
3. Profile not created properly

**Solution:**
- Review RLS policies
- Check user role and permissions
- Verify profile exists in database

## What to Look For

### In Browser Console:
1. **Task data being sent** - Is it formatted correctly?
2. **Supabase URL** - Is it the correct URL?
3. **Error details** - What's the actual error?
4. **Network requests** - Are they succeeding?

### In Test Script Output:
1. **Connection status** - Can it connect to Supabase?
2. **Profile found** - Is there a user to test with?
3. **Task creation** - Does it succeed or fail?
4. **Error details** - What's the specific error?

## Next Steps

1. **Try creating a task** and check browser console
2. **Run the test script** to isolate the issue
3. **Share the console output** with detailed error information
4. **Check Network tab** for failed requests
5. **Verify RLS policies** if permission errors

## Expected Console Output

### When Creating a Task:
```
Creating task with data: {
  "title": "Fix HVAC",
  "description": "...",
  "priority": "high",
  "status": "pending",
  "created_by": "uuid...",
  "assigned_to": null,
  "due_date": null,
  "location": "Building A"
}
Supabase client exists: true
Supabase URL: https://qkpdyveqdhokpfklyggp.supabase.co
```

### If Error Occurs:
```
Supabase error creating task:
Error object: { ... }
Error stringified: { ... }
Error message: "actual error message here"
Error details: "detailed error information"
Error hint: "suggestion to fix the error"
Error code: "error_code"
```

The enhanced logging will now show exactly what's happening!
