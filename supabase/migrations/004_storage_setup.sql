-- Create storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('task-files', 'task-files', false, 52428800, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']),
  ('profile-avatars', 'profile-avatars', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- Storage policies for task-files bucket
CREATE POLICY "Users can view files they have access to" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'task-files' AND (
      -- File uploader can access
      owner = auth.uid() OR
      -- Users with access to related tasks can access
      name IN (
        SELECT file_path FROM files f
        JOIN service_tasks st ON f.related_task_id = st.id
        WHERE st.assigned_to = auth.uid() OR st.created_by = auth.uid()
      ) OR
      -- Admins and supervisors can access all
      EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND role IN ('admin', 'supervisor')
      )
    )
  );

CREATE POLICY "Authenticated users can upload task files" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'task-files' AND
    auth.role() = 'authenticated' AND
    owner = auth.uid()
  );

CREATE POLICY "File owners can update their files" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'task-files' AND (
      owner = auth.uid() OR
      EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND role IN ('admin', 'supervisor')
      )
    )
  );

CREATE POLICY "File owners can delete their files" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'task-files' AND (
      owner = auth.uid() OR
      EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND role IN ('admin', 'supervisor')
      )
    )
  );

-- Storage policies for profile-avatars bucket
CREATE POLICY "Anyone can view profile avatars" ON storage.objects
  FOR SELECT USING (bucket_id = 'profile-avatars');

CREATE POLICY "Users can upload their own avatar" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'profile-avatars' AND
    auth.role() = 'authenticated' AND
    owner = auth.uid()
  );

CREATE POLICY "Users can update their own avatar" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'profile-avatars' AND
    owner = auth.uid()
  );

CREATE POLICY "Users can delete their own avatar" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'profile-avatars' AND
    owner = auth.uid()
  );