-- ========================================
-- RUN THIS ENTIRE SCRIPT IN SUPABASE SQL EDITOR
-- This will fix file uploads permanently
-- ========================================

-- Step 1: Disable RLS to clear everything
ALTER TABLE files DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop all existing policies
DROP POLICY IF EXISTS "Users can view their own files" ON files;
DROP POLICY IF EXISTS "Users can upload files" ON files;
DROP POLICY IF EXISTS "Users can update their own files" ON files;
DROP POLICY IF EXISTS "Users can delete their own files" ON files;
DROP POLICY IF EXISTS "System can insert files" ON files;
DROP POLICY IF EXISTS "System can update files" ON files;
DROP POLICY IF EXISTS "Authenticated users can view files" ON files;
DROP POLICY IF EXISTS "Authenticated users can upload files" ON files;
DROP POLICY IF EXISTS "files_select_policy" ON files;
DROP POLICY IF EXISTS "files_insert_policy" ON files;
DROP POLICY IF EXISTS "files_update_policy" ON files;
DROP POLICY IF EXISTS "files_delete_policy" ON files;
DROP POLICY IF EXISTS "allow_all" ON files;

-- Step 3: Enable RLS
ALTER TABLE files ENABLE ROW LEVEL SECURITY;

-- Step 4: Create simple, working policies
CREATE POLICY "files_select" ON files FOR SELECT TO authenticated USING (true);
CREATE POLICY "files_insert" ON files FOR INSERT TO authenticated WITH CHECK (auth.uid() = uploaded_by);
CREATE POLICY "files_update" ON files FOR UPDATE TO authenticated USING (auth.uid() = uploaded_by);
CREATE POLICY "files_delete" ON files FOR DELETE TO authenticated USING (auth.uid() = uploaded_by);

-- Step 5: Verify (you should see 4 rows)
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'files' ORDER BY cmd;
