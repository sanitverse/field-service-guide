-- Temporarily disable RLS to fix infinite recursion issues
-- We'll re-enable with proper policies later

-- Disable RLS on all tables temporarily
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE service_tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE files DISABLE ROW LEVEL SECURITY;
ALTER TABLE document_chunks DISABLE ROW LEVEL SECURITY;
ALTER TABLE task_comments DISABLE ROW LEVEL SECURITY;
ALTER TABLE ai_interactions DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Supervisors can view team profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view tasks assigned to them" ON service_tasks;
DROP POLICY IF EXISTS "Authorized users can create tasks" ON service_tasks;
DROP POLICY IF EXISTS "Task creators and assignees can update tasks" ON service_tasks;
DROP POLICY IF EXISTS "Admins and supervisors can delete tasks" ON service_tasks;
DROP POLICY IF EXISTS "Users can view files they uploaded or related to their tasks" ON files;
DROP POLICY IF EXISTS "Authenticated users can upload files" ON files;
DROP POLICY IF EXISTS "File uploaders can update their files" ON files;
DROP POLICY IF EXISTS "File uploaders and admins can delete files" ON files;
DROP POLICY IF EXISTS "Users can view document chunks for accessible files" ON document_chunks;
DROP POLICY IF EXISTS "System can insert document chunks" ON document_chunks;
DROP POLICY IF EXISTS "System can update document chunks" ON document_chunks;
DROP POLICY IF EXISTS "Users can view comments on accessible tasks" ON task_comments;
DROP POLICY IF EXISTS "Users can create comments on accessible tasks" ON task_comments;
DROP POLICY IF EXISTS "Comment authors can update their comments" ON task_comments;
DROP POLICY IF EXISTS "Comment authors and admins can delete comments" ON task_comments;
DROP POLICY IF EXISTS "Users can view their own AI interactions" ON ai_interactions;
DROP POLICY IF EXISTS "Users can create their own AI interactions" ON ai_interactions;
DROP POLICY IF EXISTS "Admins can view all AI interactions" ON ai_interactions;