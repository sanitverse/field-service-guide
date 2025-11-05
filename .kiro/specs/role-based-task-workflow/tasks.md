# Implementation Plan

- [x] 1. Update database schema and RLS policies


  - Add 'awaiting_review' status to service_tasks table
  - Create task_history table for tracking changes
  - Update task_comments table with author_role and comment_type fields
  - Implement RLS policies for role-based task visibility
  - Create RLS policies for task creation (Supervisor only)
  - Implement RLS policies for task updates with role-specific rules
  - _Requirements: 1.1, 1.5, 2.1, 2.4, 3.1, 3.4, 5.1, 5.4, 6.1, 6.4, 7.1_




- [ ] 2. Create role-based task list component
  - Build TaskListView component with role-aware rendering
  - Implement Supervisor view showing all tasks with filters
  - Implement Technician view showing only assigned tasks
  - Add conditional "Create Task" button for Supervisors only

  - Create task statistics dashboard for Supervisors
  - Add task counters and status indicators
  - _Requirements: 1.1, 1.5, 2.1, 2.2, 2.3, 2.4, 2.5, 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 3. Build Supervisor task creation and assignment form
  - Create SupervisorTaskForm component with all task fields
  - Implement Technician selector dropdown with active users only
  - Add form validation for required fields and due date
  - Integrate file upload capability during task creation
  - Create API route for task creation with Supervisor authorization
  - Implement task assignment notification to Technician
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 6.1, 6.2, 6.5_

- [ ] 4. Implement role-aware task detail view
  - Create TaskDetailView component with role-based rendering
  - Build Supervisor view with edit, reassign, and delete actions
  - Build Technician view with read-only details and limited actions
  - Implement status update dropdown with role-appropriate options
  - Add visual indicators for task priority and status
  - Display task history and assignment changes
  - _Requirements: 2.3, 2.5, 3.1, 5.3, 6.1, 6.3, 6.4_

- [ ] 5. Create Technician feedback and status update system
  - Build TaskFeedback component for adding comments
  - Implement status update buttons for Technicians (in_progress, awaiting_review)
  - Add file upload section for work documentation
  - Create API route for status updates with role validation
  - Implement automatic status change notifications to Supervisors
  - Prevent Technicians from setting completed or cancelled status
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ] 6. Build Supervisor task review interface
  - Create TaskReviewPanel component for reviewing completed work
  - Display all Technician feedback chronologically
  - Show all uploaded files with preview capability
  - Implement approve action (sets status to completed)
  - Implement request changes action (returns to in_progress with comment)
  - Create API route for task review with Supervisor authorization
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 7. Implement task reassignment functionality
  - Add reassign button to Supervisor task detail view
  - Create reassignment dialog with Technician selector
  - Implement API route for task reassignment
  - Send notifications to both previous and new Technicians
  - Update task history with reassignment record
  - _Requirements: 6.1, 6.2, 6.3, 6.5_

- [ ] 8. Build comprehensive notification system
  - Create TaskNotifications component with real-time updates
  - Implement Supabase real-time subscriptions for task events
  - Add notification bell with unread count indicator
  - Create notification history panel
  - Implement toast notifications for immediate alerts
  - Configure notification triggers for all task events (assignment, status changes, comments)
  - _Requirements: 1.4, 3.5, 5.1, 6.2, 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ] 9. Create task history tracking system
  - Implement automatic history logging for task changes
  - Create TaskHistory component to display change timeline
  - Log task creation, assignment, reassignment, status changes, and edits
  - Display history in task detail view
  - _Requirements: 6.3, 6.5_

- [ ] 10. Implement role-based UI restrictions
  - Add role checks to hide/show UI elements based on permissions
  - Disable actions that users don't have permission to perform
  - Create useRolePermissions hook for consistent permission checking
  - Add role guards to protected routes and components
  - _Requirements: 1.5, 2.2, 3.4, 5.5, 6.4_

- [ ]* 11. Write comprehensive tests for role-based workflow
  - Create unit tests for role permission logic
  - Test task status transition validation
  - Write integration tests for complete task lifecycle
  - Test RLS policies for data access control
  - Create E2E tests for Supervisor and Technician workflows
  - Test notification system triggers and delivery
  - _Requirements: All requirements_

- [ ] 12. Update existing components for role-based workflow
  - Update existing TaskForm to use new SupervisorTaskForm
  - Modify TaskCard to show role-appropriate actions
  - Update task API routes to enforce role-based permissions
  - Refactor task list page to use new role-based component
  - Update navigation to hide/show menu items based on role
  - _Requirements: All requirements_
