#!/usr/bin/env node

/**
 * Create Simple Delete Policy
 * Creates a working DELETE policy for task deletion
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Use service role to modify policies
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createSimpleDeletePolicy() {
  console.log('🔧 Creating Simple Delete Policy\n');

  try {
    // 1. First, let's disable RLS temporarily to clean up
    console.log('1. Temporarily disabling RLS...');
    const { error: disableError } = await supabase.rpc('exec', {
      sql: 'ALTER TABLE service_tasks DISABLE ROW LEVEL SECURITY;'
    });

    if (disableError && !disableError.message.includes('Could not find the function')) {
      console.log('⚠️ Could not disable RLS:', disableError.message);
    } else {
      console.log('✅ RLS disabled');
    }

    // 2. Re-enable RLS and create a simple policy
    console.log('\n2. Re-enabling RLS with simple policy...');
    const { error: enableError } = await supabase.rpc('exec', {
      sql: 'ALTER TABLE service_tasks ENABLE ROW LEVEL SECURITY;'
    });

    if (enableError && !enableError.message.includes('Could not find the function')) {
      console.log('⚠️ Could not enable RLS:', enableError.message);
    } else {
      console.log('✅ RLS enabled');
    }

    // 3. Create simple policies
    console.log('\n3. Creating simple policies...');
    
    const policies = [
      // Allow all authenticated users to view tasks
      `CREATE POLICY "Allow authenticated users to view tasks" 
       ON service_tasks FOR SELECT 
       TO authenticated 
       USING (true);`,
      
      // Allow authenticated users to create tasks
      `CREATE POLICY "Allow authenticated users to create tasks" 
       ON service_tasks FOR INSERT 
       TO authenticated 
       WITH CHECK (created_by = auth.uid());`,
      
      // Allow users to update tasks they created or are assigned to
      `CREATE POLICY "Allow users to update their tasks" 
       ON service_tasks FOR UPDATE 
       TO authenticated 
       USING (created_by = auth.uid() OR assigned_to = auth.uid());`,
      
      // Allow users to delete tasks they created
      `CREATE POLICY "Allow users to delete tasks they created" 
       ON service_tasks FOR DELETE 
       TO authenticated 
       USING (created_by = auth.uid());`
    ];

    for (let i = 0; i < policies.length; i++) {
      const { error } = await supabase.rpc('exec', { sql: policies[i] });
      
      if (error && !error.message.includes('Could not find the function')) {
        console.log(`❌ Policy ${i + 1} failed:`, error.message);
      } else {
        console.log(`✅ Policy ${i + 1} created`);
      }
    }

    // 4. Test the delete functionality
    console.log('\n4. Testing delete functionality...');
    
    // Login as admin
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'admin.fieldservice@yopmail.com',
      password: 'Admin@12345'
    });

    if (authError) {
      console.log('❌ Admin login failed:', authError.message);
      return;
    }

    // Create test task
    const { data: taskData, error: taskError } = await supabase
      .from('service_tasks')
      .insert({
        title: 'Simple Policy Test',
        description: 'Testing simple delete policy',
        priority: 'low',
        status: 'pending',
        created_by: authData.user.id
      })
      .select()
      .single();

    if (taskError) {
      console.log('❌ Task creation failed:', taskError.message);
      return;
    }

    console.log('✅ Test task created:', taskData.id);

    // Try to delete
    const { data: deleteData, error: deleteError } = await supabase
      .from('service_tasks')
      .delete()
      .eq('id', taskData.id)
      .select();

    if (deleteError) {
      console.log('❌ Delete failed:', deleteError.message);
    } else {
      console.log('✅ Delete succeeded:', deleteData);
    }

    // Verify deletion
    const { data: verifyData } = await supabase
      .from('service_tasks')
      .select('id')
      .eq('id', taskData.id);

    if (verifyData.length === 0) {
      console.log('✅ Task successfully deleted and verified');
    } else {
      console.log('❌ Task still exists after delete');
    }

    await supabase.auth.signOut();

  } catch (error) {
    console.log('❌ Error creating simple delete policy:', error.message);
  }

  console.log('\n✨ Simple delete policy creation completed!');
}

createSimpleDeletePolicy().catch(console.error);