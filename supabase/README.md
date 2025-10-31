# Supabase Configuration

This directory contains the Supabase configuration and database schema for the Field Service Guide application.

## Setup

### Prerequisites

1. **Supabase CLI**: Install the Supabase CLI globally
   ```bash
   npm install -g supabase
   ```

2. **Docker**: Ensure Docker is installed and running on your system

### Local Development

1. **Initialize and start Supabase**:
   ```bash
   # Run the setup script
   node scripts/setup-supabase.js
   
   # Or manually:
   supabase start
   ```

2. **Configure environment variables**:
   Create a `.env.local` file in the project root with:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<your_anon_key>
   SUPABASE_SERVICE_ROLE_KEY=<your_service_role_key>
   OPENAI_API_KEY=<your_openai_key>
   ```

3. **Access local services**:
   - **API**: http://127.0.0.1:54321
   - **Studio**: http://127.0.0.1:54323
   - **Inbucket (Email)**: http://127.0.0.1:54324

### Database Schema

The database includes the following main tables:

- **profiles**: User profiles extending Supabase auth
- **service_tasks**: Service task management
- **files**: File upload and storage tracking
- **document_chunks**: RAG document processing
- **task_comments**: Task collaboration
- **ai_interactions**: AI chat history

### Migrations

Migrations are located in the `migrations/` directory:

1. `001_initial_schema.sql` - Core database schema
2. `002_rls_policies.sql` - Row Level Security policies
3. `003_functions_triggers.sql` - Database functions and triggers
4. `004_storage_setup.sql` - Storage buckets and policies

### Storage Buckets

- **task-files**: For task-related file uploads (50MB limit)
- **profile-avatars**: For user profile pictures (5MB limit)

### Functions

- `search_documents()` - Vector similarity search for RAG
- `get_task_statistics()` - Task analytics
- `get_user_activity_metrics()` - User performance metrics
- `get_storage_statistics()` - File storage analytics

### Row Level Security (RLS)

All tables have RLS enabled with policies for:
- Role-based access control
- User data isolation
- Admin and supervisor overrides
- Task-based file access

### Seed Data

The `seed.sql` file contains sample data for development:
- Sample user profiles for each role
- Example service tasks
- Task comments
- AI interaction history

## Production Deployment

1. **Create Supabase project**: Visit [supabase.com](https://supabase.com)
2. **Run migrations**: Use the Supabase dashboard or CLI
3. **Configure environment variables**: Update production environment
4. **Enable required extensions**: Ensure `vector` extension is enabled
5. **Set up storage**: Configure storage buckets and policies

## Troubleshooting

### Common Issues

1. **Vector extension not found**:
   - Ensure the `vector` extension is enabled in your Supabase project
   - For local development, it should be automatically available

2. **Migration errors**:
   - Check that all dependencies are installed
   - Verify Docker is running for local development

3. **RLS policy errors**:
   - Ensure users have proper profiles created
   - Check that auth context is properly set

### Useful Commands

```bash
# Reset local database
supabase db reset

# Generate TypeScript types
supabase gen types typescript --local > lib/database.types.ts

# View logs
supabase logs

# Stop local services
supabase stop
```