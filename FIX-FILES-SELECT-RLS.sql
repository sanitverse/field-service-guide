-- The SELECT policy exists but might not be working correctly
-- Let's recreate it with explicit permissions

-- Drop the existing SELECT policy
DROP POLICY IF EXISTS "files_select" ON files;

-- Create a new SELECT policy that definitely works
CREATE POLICY "files_select_authenticated" ON files
  FOR SELECT
  TO authenticated
  USING (true);

-- Verify it was created
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'files' AND cmd = 'SELECT';

-- Test if you can now select files
SELECT id, filename, uploaded_by FROM files;
