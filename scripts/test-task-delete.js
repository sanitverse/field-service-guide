#!/usr/bin/env node

/**
 * Test Task Delete Functionality
 * Creates a test task and then deletes it to verify the delete function works
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testTaskDelete() {
  console.log('🧪 Testing Task Delete Functionality\n');

  try {
    // 1. Login as admin to have delete permissions
    console.log('1. Logging in as admin...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'admin.fieldservice@yopmail.com',
      password: 'Admin@12345'
    });

    if (authError) {
      console.log('❌ Admin login failed:', authError.message);
      return;
    }
    console.log('✅ Admin logged in successfully');

    // 2. Create a test task
    console.log('\n2. Creating test task...');
    const { data: taskData, error: taskError } = await supabase
      .from('service_tasks')
      .insert({
        title: 'Test Delete Task',
        description: 'This task will be deleted to test the delete functionality',
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

    // 3. Test the delete function
    console.log('\n3. Testing delete function...');
    const { error: deleteError } = await supabase
      .from('service_tasks')
      .delete()
      .eq('id', taskData.id);

    if (deleteError) {
      console.log('❌ Delete failed:', deleteError.message);
    } else {
      console.log('✅ Task deleted successfully');
    }

    // 4. Verify task is deleted
    console.log('\n4. Verifying task deletion...');
    const { data: verifyData, error: verifyError } = await supabase
      .from('service_tasks')
      .select('id')
      .eq('id', taskData.id);

    if (verifyError) {
      console.log('❌ Verification failed:', verifyError.message);
    } else if (verifyData.length === 0) {
      console.log('✅ Task successfully deleted - not found in database');
    } else {
      console.log('❌ Task still exists in database');
    }

    // Sign out
    await supabase.auth.signOut();

  } catch (error) {
    console.log('❌ Test error:', error.message);
  }

  console.log('\n✨ Task delete test completed!');
}

testTaskDelete().catch(console.error);