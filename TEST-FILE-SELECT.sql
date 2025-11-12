-- Test if you can SELECT files
-- Run this in Supabase SQL Editor

-- First, check if files exist
SELECT COUNT(*) as total_files FROM files;

-- Then, try to select them (this simulates what the API does)
SELECT 
  id,
  filename,
  file_size,
  mime_type,
  uploaded_by,
  created_at
FROM files
ORDER BY created_at DESC;

-- Check if the SELECT policy exists and is correct
SELECT 
  policyname,
  cmd,
  qual as using_clause,
  with_check
FROM pg_policies
WHERE tablename = 'files' AND cmd = 'SELECT';

-- Test with the profile join (this is what might be failing)
SELECT 
  f.*,
  p.id as uploader_id,
  p.full_name as uploader_name,
  p.email as uploader_email
FROM files f
LEFT JOIN profiles p ON f.uploaded_by = p.id
ORDER BY f.created_at DESC;
