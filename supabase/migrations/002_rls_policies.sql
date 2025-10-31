-- Enable Row Level Security on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_interactions ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update all profiles" ON profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Supervisors can view team profiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'supervisor')
    )
  );

-- Service tasks policies
CREATE POLICY "Users can view tasks assigned to them" ON service_tasks
  FOR SELECT USING (
    assigned_to = auth.uid() OR 
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'supervisor')
    )
  );

CREATE POLICY "Authorized users can create tasks" ON service_tasks
  FOR INSERT WITH CHECK (
    created_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'supervisor', 'technician')
    )
  );

CREATE POLICY "Task creators and assignees can update tasks" ON service_tasks
  FOR UPDATE USING (
    assigned_to = auth.uid() OR 
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'supervisor')
    )
  );

CREATE POLICY "Admins and supervisors can delete tasks" ON service_tasks
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'supervisor')
    )
  );

-- Files policies
CREATE POLICY "Users can view files they uploaded or related to their tasks" ON files
  FOR SELECT USING (
    uploaded_by = auth.uid() OR
    related_task_id IN (
      SELECT id FROM service_tasks 
      WHERE assigned_to = auth.uid() OR created_by = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'supervisor')
    )
  );

CREATE POLICY "Authenticated users can upload files" ON files
  FOR INSERT WITH CHECK (
    uploaded_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "File uploaders can update their files" ON files
  FOR UPDATE USING (
    uploaded_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'supervisor')
    )
  );

CREATE POLICY "File uploaders and admins can delete files" ON files
  FOR DELETE USING (
    uploaded_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'supervisor')
    )
  );

-- Document chunks policies (inherit from files)
CREATE POLICY "Users can view document chunks for accessible files" ON document_chunks
  FOR SELECT USING (
    file_id IN (
      SELECT id FROM files 
      WHERE uploaded_by = auth.uid() OR
      related_task_id IN (
        SELECT id FROM service_tasks 
        WHERE assigned_to = auth.uid() OR created_by = auth.uid()
      ) OR
      EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND role IN ('admin', 'supervisor')
      )
    )
  );

CREATE POLICY "System can insert document chunks" ON document_chunks
  FOR INSERT WITH CHECK (true); -- This will be handled by service role

CREATE POLICY "System can update document chunks" ON document_chunks
  FOR UPDATE USING (true); -- This will be handled by service role

-- Task comments policies
CREATE POLICY "Users can view comments on accessible tasks" ON task_comments
  FOR SELECT USING (
    task_id IN (
      SELECT id FROM service_tasks 
      WHERE assigned_to = auth.uid() OR created_by = auth.uid() OR
      EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND role IN ('admin', 'supervisor')
      )
    )
  );

CREATE POLICY "Users can create comments on accessible tasks" ON task_comments
  FOR INSERT WITH CHECK (
    author_id = auth.uid() AND
    task_id IN (
      SELECT id FROM service_tasks 
      WHERE assigned_to = auth.uid() OR created_by = auth.uid() OR
      EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND role IN ('admin', 'supervisor')
      )
    )
  );

CREATE POLICY "Comment authors can update their comments" ON task_comments
  FOR UPDATE USING (
    author_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'supervisor')
    )
  );

CREATE POLICY "Comment authors and admins can delete comments" ON task_comments
  FOR DELETE USING (
    author_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'supervisor')
    )
  );

-- AI interactions policies
CREATE POLICY "Users can view their own AI interactions" ON ai_interactions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create their own AI interactions" ON ai_interactions
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Admins can view all AI interactions" ON ai_interactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );