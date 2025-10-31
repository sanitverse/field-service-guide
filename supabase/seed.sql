-- Seed data for development and testing

-- Insert sample profiles (these would normally be created via auth signup)
-- Note: In production, these would be created automatically via the trigger
INSERT INTO profiles (id, email, full_name, role, status) VALUES
  ('00000000-0000-0000-0000-000000000001', 'admin@fieldservice.com', 'System Administrator', 'admin', 'active'),
  ('00000000-0000-0000-0000-000000000002', 'supervisor@fieldservice.com', 'Field Supervisor', 'supervisor', 'active'),
  ('00000000-0000-0000-0000-000000000003', 'tech1@fieldservice.com', 'John Technician', 'technician', 'active'),
  ('00000000-0000-0000-0000-000000000004', 'tech2@fieldservice.com', 'Jane Technician', 'technician', 'active'),
  ('00000000-0000-0000-0000-000000000005', 'customer@example.com', 'Customer User', 'customer', 'active')
ON CONFLICT (id) DO NOTHING;

-- Insert sample service tasks
INSERT INTO service_tasks (id, title, description, status, priority, assigned_to, created_by, due_date, location) VALUES
  (
    '10000000-0000-0000-0000-000000000001',
    'Install new HVAC system',
    'Complete installation of new HVAC system in building A. Includes ductwork, unit installation, and testing.',
    'pending',
    'high',
    '00000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000002',
    NOW() + INTERVAL '3 days',
    'Building A, Floor 2'
  ),
  (
    '10000000-0000-0000-0000-000000000002',
    'Routine maintenance check',
    'Perform routine maintenance on elevator systems. Check cables, motors, and safety systems.',
    'in_progress',
    'medium',
    '00000000-0000-0000-0000-000000000004',
    '00000000-0000-0000-0000-000000000002',
    NOW() + INTERVAL '1 day',
    'Main Building, Elevator Bank'
  ),
  (
    '10000000-0000-0000-0000-000000000003',
    'Emergency repair - Water leak',
    'Urgent repair needed for water leak in basement. Potential flooding risk.',
    'pending',
    'urgent',
    '00000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000002',
    NOW() + INTERVAL '4 hours',
    'Basement Level B1'
  ),
  (
    '10000000-0000-0000-0000-000000000004',
    'Electrical panel inspection',
    'Annual inspection of main electrical panels. Document any issues and recommend repairs.',
    'completed',
    'medium',
    '00000000-0000-0000-0000-000000000004',
    '00000000-0000-0000-0000-000000000002',
    NOW() - INTERVAL '2 days',
    'Electrical Room, Ground Floor'
  ),
  (
    '10000000-0000-0000-0000-000000000005',
    'Security system upgrade',
    'Upgrade security cameras and access control systems in lobby area.',
    'pending',
    'low',
    NULL,
    '00000000-0000-0000-0000-000000000002',
    NOW() + INTERVAL '1 week',
    'Main Lobby'
  )
ON CONFLICT (id) DO NOTHING;

-- Insert sample task comments
INSERT INTO task_comments (task_id, author_id, content) VALUES
  (
    '10000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000004',
    'Started the maintenance check. Found minor wear on cable 2, will need replacement soon.'
  ),
  (
    '10000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000002',
    'Thanks for the update. Please order the replacement cable and schedule installation for next week.'
  ),
  (
    '10000000-0000-0000-0000-000000000004',
    '00000000-0000-0000-0000-000000000004',
    'Inspection completed. All panels are in good condition. No immediate repairs needed.'
  ),
  (
    '10000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000003',
    'Reviewed the installation plans. Will need to coordinate with building management for access.'
  )
ON CONFLICT DO NOTHING;

-- Insert sample AI interactions
INSERT INTO ai_interactions (user_id, question, response, context) VALUES
  (
    '00000000-0000-0000-0000-000000000003',
    'How do I perform HVAC system diagnostics?',
    'To perform HVAC system diagnostics, follow these steps: 1) Check thermostat settings, 2) Inspect air filters, 3) Examine electrical connections, 4) Test system pressures, 5) Verify refrigerant levels. Always ensure safety protocols are followed.',
    '{"task_id": "10000000-0000-0000-0000-000000000001", "context_type": "task_assistance"}'
  ),
  (
    '00000000-0000-0000-0000-000000000004',
    'What are the safety requirements for elevator maintenance?',
    'Elevator maintenance safety requirements include: 1) Lock out/tag out procedures, 2) Use of proper fall protection, 3) Verification of emergency stop functions, 4) Proper lighting in shaft areas, 5) Communication with building occupants. Always follow OSHA guidelines and manufacturer specifications.',
    '{"task_id": "10000000-0000-0000-0000-000000000002", "context_type": "safety_inquiry"}'
  ),
  (
    '00000000-0000-0000-0000-000000000002',
    'Show me task completion statistics for this month',
    'This month''s task statistics: Total tasks: 15, Completed: 8 (53%), In Progress: 4 (27%), Pending: 3 (20%). Average completion time: 2.3 days. Top performer: Jane Technician with 4 completed tasks.',
    '{"context_type": "analytics_request", "time_period": "current_month"}'
  )
ON CONFLICT DO NOTHING;