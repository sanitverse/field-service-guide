# Admin Tools Documentation

This directory contains administrative scripts for managing the Field Service Guide application.

## Available Scripts

### 1. Create Admin User (`create-admin-user.js`)
Creates the initial admin user for the system.

```bash
node scripts/create-admin-user.js
```

**Default Admin Credentials:**
- Email: `admin.fieldservice@yopmail.com`
- Password: `Admin@12345`
- Role: `admin`

### 2. Verify Admin User (`verify-admin-user.js`)
Verifies that the admin user was created correctly and tests login functionality.

```bash
node scripts/verify-admin-user.js
```

### 3. List Users (`list-users.js`)
Displays all users in the system in a formatted table.

```bash
node scripts/list-users.js
```

### 4. Admin Tools (`admin-tools.js`)
Comprehensive admin management tool with multiple commands.

#### User Management Commands:

**Create User:**
```bash
node scripts/admin-tools.js create-user <email> <password> <fullName> [role]
```
Example:
```bash
node scripts/admin-tools.js create-user tech@company.com Tech123! "John Doe" technician
```

**Update User Role:**
```bash
node scripts/admin-tools.js update-role <email> <newRole>
```
Example:
```bash
node scripts/admin-tools.js update-role tech@company.com supervisor
```

**Deactivate User:**
```bash
node scripts/admin-tools.js deactivate <email>
```

**Reactivate User:**
```bash
node scripts/admin-tools.js reactivate <email>
```

**Reset Password:**
```bash
node scripts/admin-tools.js reset-password <email> <newPassword>
```

#### System Information Commands:

**List All Users:**
```bash
node scripts/admin-tools.js list-users
```

**Show System Statistics:**
```bash
node scripts/admin-tools.js stats
```

## User Roles

The system supports the following user roles:

- **admin**: Full system access, can manage all users and tasks
- **supervisor**: Can manage tasks and view reports, limited user management
- **technician**: Can view and update assigned tasks, create comments
- **customer**: Read-only access to their related tasks (future use)

## Environment Requirements

All scripts require the following environment variables in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Security Notes

1. **Service Role Key**: The scripts use the Supabase service role key which has admin privileges. Keep this key secure.

2. **Password Requirements**: When creating users, ensure passwords meet security requirements:
   - Minimum 8 characters
   - Include uppercase, lowercase, numbers, and special characters

3. **Admin Access**: Admin users have full system access. Only create admin accounts for trusted personnel.

## Troubleshooting

### Common Issues:

1. **Missing Environment Variables:**
   ```
   ❌ Missing Supabase environment variables
   ```
   Solution: Ensure `.env.local` contains the required Supabase configuration.

2. **User Already Exists:**
   ```
   ⚠️ User already exists in Auth, checking profile...
   ```
   This is normal - the script will update the existing user's profile if needed.

3. **Permission Errors:**
   ```
   ❌ Error creating user: insufficient_privileges
   ```
   Solution: Verify the `SUPABASE_SERVICE_ROLE_KEY` is correct and has admin privileges.

## Examples

### Setting up a complete team:

```bash
# Create admin user (already done)
node scripts/create-admin-user.js

# Create a supervisor
node scripts/admin-tools.js create-user supervisor@company.com Super123! "Jane Smith" supervisor

# Create technicians
node scripts/admin-tools.js create-user tech1@company.com Tech123! "Mike Johnson" technician
node scripts/admin-tools.js create-user tech2@company.com Tech123! "Sarah Wilson" technician

# Verify all users
node scripts/admin-tools.js list-users

# Check system stats
node scripts/admin-tools.js stats
```

### Promoting a technician to supervisor:

```bash
node scripts/admin-tools.js update-role tech1@company.com supervisor
```

### Handling user issues:

```bash
# Deactivate a problematic user
node scripts/admin-tools.js deactivate problem@company.com

# Reset a forgotten password
node scripts/admin-tools.js reset-password user@company.com NewPassword123!

# Reactivate when ready
node scripts/admin-tools.js reactivate problem@company.com
```

## Support

For issues with these scripts, check:
1. Environment variables are correctly set
2. Supabase connection is working
3. Service role key has proper permissions
4. Database tables exist and are accessible