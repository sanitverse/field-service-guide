-- Role-Based Task Workflow Migration
-- This migration implements the role-based task assignment workflow

-- 1. Add 'awaiting_review' status to service_tasks table
ALTER TABLE service_tasks 
DROP CONSTRAINT IF EXISTS service_tasks_status_check;

ALTER TABLE service_tasks 
ADD CONSTRAINT service_tasks_status_check 
CHECK (status IN ('pending', 'in_progress', 'awaiting_review', 'completed', 'cancelled'));

-- 2. Create task_history table for tracking changes
CREATE TABLE task_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES service_tasks(id) ON DELETE CASCADE,
  changed_by UUID REFERENCES profiles(id) NOT NULL,
  change_type TEXT CHECK (change_type IN ('created', 'assigned', 'reassigned', 'status_changed', 'edited')),
  old_value JSONB,
  new_value JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for task_history
CREATE INDEX idx_task_history_task_id ON task_history(task_id);
CREATE INDEX idx_task_history_created_at ON task_history(created_at DESC);
CREATE INDEX idx_task_history_change_type ON task_history(change_type);

-- 3. Update task_comments table with author_role and comment_type fields
ALTER TABLE task_comments 
ADD COLUMN author_role TEXT CHECK (author_role IN ('supervisor', 'technician', 'admin'));

ALTER TABLE task_comments 
ADD COLUMN comment_type TEXT CHECK (comment_type IN ('user_comment', 'status_update', 'system_notification')) DEFAULT 'user_comment';

-- Create additional indexes for task_comments
CREATE INDEX idx_task_comments_author_role ON task_comments(author_role);
CREATE INDEX idx_task_comments_comment_type ON task_comments(comment_type);

-- 4. Drop existing RLS policies to implement role-based access
DROP POLICY IF EXISTS "Authenticated users can view all tasks" ON service_tasks;
DROP POLICY IF EXISTS "Authenticated users can create tasks" ON service_tasks;
DROP POLICY IF EXISTS "Authenticated users can update tasks" ON service_tasks;
DROP POLICY IF EXISTS "Users can view tasks assigned to them" ON service_tasks;
DROP POLICY IF EXISTS "Authorized users can create tasks" ON service_tasks;
DROP POLICY IF EXISTS "Task creators and assignees can update tasks" ON service_tasks;
DROP POLICY IF EXISTS "Admins and supervisors can delete tasks" ON service_tasks;

-- 5. Implement new role-based RLS policies

-- Task visibility policies
-- Supervisors and admins can see all tasks
CREATE POLICY "Supervisors can view all tasks"
ON service_tasks FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('supervisor', 'admin')
  )
);

-- Technicians can only see assigned tasks
CREATE POLICY "Technicians can view assigned tasks"
ON service_tasks FOR SELECT
TO authenticated
USING (
  assigned_to = auth.uid()
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'technician'
  )
);

-- Task creation policies
-- Only Supervisors and admins can create tasks
CREATE POLICY "Supervisors can create tasks"
ON service_tasks FOR INSERT
TO authenticated
WITH CHECK (
  created_by = auth.uid()
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('supervisor', 'admin')
  )
);

-- Task update policies
-- Supervisors and admins can update any field
CREATE POLICY "Supervisors can update all task fields"
ON service_tasks FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('supervisor', 'admin')
  )
);

-- Technicians can only update status of assigned tasks (limited statuses)
CREATE POLICY "Technicians can update assigned task status"
ON service_tasks FOR UPDATE
TO authenticated
USING (
  assigned_to = auth.uid()
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'technician'
  )
)
WITH CHECK (
  assigned_to = auth.uid()
  AND status IN ('in_progress', 'awaiting_review')
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'technician'
  )
);

-- Task deletion policy
-- Only Supervisors and admins can delete tasks
CREATE POLICY "Supervisors can delete tasks"
ON service_tasks FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('supervisor', 'admin')
  )
);

-- 6. RLS policies for task_history table
ALTER TABLE task_history ENABLE ROW LEVEL SECURITY;

-- Users can view history of tasks they can access
CREATE POLICY "Users can view task history for accessible tasks"
ON task_history FOR SELECT
TO authenticated
USING (
  task_id IN (
    SELECT id FROM service_tasks
    WHERE (
      -- Supervisors can see all task history
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('supervisor', 'admin')
      )
    ) OR (
      -- Technicians can see history of assigned tasks
      assigned_to = auth.uid()
      AND EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'technician'
      )
    )
  )
);

-- Only authenticated users can create history entries (via triggers/functions)
CREATE POLICY "System can create task history"
ON task_history FOR INSERT
TO authenticated
WITH CHECK (changed_by = auth.uid());

-- 7. Update task_comments RLS policies for role-based access
DROP POLICY IF EXISTS "Users can view comments for accessible tasks" ON task_comments;
DROP POLICY IF EXISTS "Users can create comments for accessible tasks" ON task_comments;

-- Users can view comments for tasks they can access
CREATE POLICY "Users can view comments for accessible tasks"
ON task_comments FOR SELECT
TO authenticated
USING (
  task_id IN (
    SELECT id FROM service_tasks
    WHERE (
      -- Supervisors can see all comments
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('supervisor', 'admin')
      )
    ) OR (
      -- Technicians can see comments on assigned tasks
      assigned_to = auth.uid()
      AND EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'technician'
      )
    )
  )
);

-- Users can create comments for tasks they can access
CREATE POLICY "Users can create comments for accessible tasks"
ON task_comments FOR INSERT
TO authenticated
WITH CHECK (
  author_id = auth.uid()
  AND task_id IN (
    SELECT id FROM service_tasks
    WHERE (
      -- Supervisors can comment on all tasks
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('supervisor', 'admin')
      )
    ) OR (
      -- Technicians can comment on assigned tasks
      assigned_to = auth.uid()
      AND EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'technician'
      )
    )
  )
);

-- 8. Create function to automatically populate author_role in task_comments
CREATE OR REPLACE FUNCTION populate_comment_author_role()
RETURNS TRIGGER AS $$
BEGIN
  -- Get the user's role and populate author_role
  SELECT role INTO NEW.author_role
  FROM profiles
  WHERE id = NEW.author_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically populate author_role
CREATE TRIGGER trigger_populate_comment_author_role
  BEFORE INSERT ON task_comments
  FOR EACH ROW
  EXECUTE FUNCTION populate_comment_author_role();

-- 9. Create function to log task changes to history
CREATE OR REPLACE FUNCTION log_task_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Log task creation
  IF TG_OP = 'INSERT' THEN
    INSERT INTO task_history (task_id, changed_by, change_type, new_value)
    VALUES (NEW.id, NEW.created_by, 'created', to_jsonb(NEW));
    RETURN NEW;
  END IF;
  
  -- Log task updates
  IF TG_OP = 'UPDATE' THEN
    -- Log assignment changes
    IF OLD.assigned_to IS DISTINCT FROM NEW.assigned_to THEN
      INSERT INTO task_history (task_id, changed_by, change_type, old_value, new_value)
      VALUES (
        NEW.id, 
        auth.uid(), 
        CASE 
          WHEN OLD.assigned_to IS NULL THEN 'assigned'
          ELSE 'reassigned'
        END,
        jsonb_build_object('assigned_to', OLD.assigned_to),
        jsonb_build_object('assigned_to', NEW.assigned_to)
      );
    END IF;
    
    -- Log status changes
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      INSERT INTO task_history (task_id, changed_by, change_type, old_value, new_value)
      VALUES (
        NEW.id,
        auth.uid(),
        'status_changed',
        jsonb_build_object('status', OLD.status),
        jsonb_build_object('status', NEW.status)
      );
    END IF;
    
    -- Log other field changes
    IF (OLD.title, OLD.description, OLD.priority, OLD.due_date, OLD.location) IS DISTINCT FROM 
       (NEW.title, NEW.description, NEW.priority, NEW.due_date, NEW.location) THEN
      INSERT INTO task_history (task_id, changed_by, change_type, old_value, new_value)
      VALUES (
        NEW.id,
        auth.uid(),
        'edited',
        jsonb_build_object(
          'title', OLD.title,
          'description', OLD.description,
          'priority', OLD.priority,
          'due_date', OLD.due_date,
          'location', OLD.location
        ),
        jsonb_build_object(
          'title', NEW.title,
          'description', NEW.description,
          'priority', NEW.priority,
          'due_date', NEW.due_date,
          'location', NEW.location
        )
      );
    END IF;
    
    RETURN NEW;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to log task changes
CREATE TRIGGER trigger_log_task_changes
  AFTER INSERT OR UPDATE ON service_tasks
  FOR EACH ROW
  EXECUTE FUNCTION log_task_changes();

-- 10. Create function to validate task status transitions for technicians
CREATE OR REPLACE FUNCTION validate_technician_status_transitions()
RETURNS TRIGGER AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- Get the user's role
  SELECT role INTO user_role
  FROM profiles
  WHERE id = auth.uid();
  
  -- If user is technician, validate status transitions
  IF user_role = 'technician' THEN
    -- Technicians can only change status to in_progress or awaiting_review
    IF NEW.status NOT IN ('in_progress', 'awaiting_review') THEN
      RAISE EXCEPTION 'Technicians can only set status to in_progress or awaiting_review';
    END IF;
    
    -- Technicians can only update tasks assigned to them
    IF NEW.assigned_to != auth.uid() THEN
      RAISE EXCEPTION 'Technicians can only update tasks assigned to them';
    END IF;
    
    -- Technicians cannot change other fields except status
    IF (OLD.title, OLD.description, OLD.priority, OLD.assigned_to, OLD.due_date, OLD.location, OLD.created_by) IS DISTINCT FROM 
       (NEW.title, NEW.description, NEW.priority, NEW.assigned_to, NEW.due_date, NEW.location, NEW.created_by) THEN
      RAISE EXCEPTION 'Technicians can only update task status';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to validate technician status transitions
CREATE TRIGGER trigger_validate_technician_status_transitions
  BEFORE UPDATE ON service_tasks
  FOR EACH ROW
  EXECUTE FUNCTION validate_technician_status_transitions();

-- 11. Create indexes for better performance with new fields
CREATE INDEX idx_task_history_changed_by ON task_history(changed_by);
CREATE INDEX idx_task_comments_created_at ON task_comments(created_at DESC);

-- 12. Grant necessary permissions
GRANT SELECT, INSERT ON task_history TO authenticated;
GRANT SELECT, INSERT, UPDATE ON task_comments TO authenticated;

-- Refresh the schema cache
NOTIFY pgrst, 'reload schema';