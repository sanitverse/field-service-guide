#!/usr/bin/env node

/**
 * Test Authenticated User Delete
 * Focuses on testing delete with authenticated users
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testAuthUserDelete() {
  console.log('🧪 Testing Authenticated User Delete\n');

  try {
    // 1. Login as admin
    console.log('1. Logging in as admin...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'admin.fieldservice@yopmail.com',
      password: 'Admin@12345'
    });

    if (authError) {
      console.log('❌ Login failed:', authError.message);
      return;
    }

    console.log('✅ Logged in as:', authData.user.email);
    console.log('User ID:', authData.user.id);

    // 2. Create a test task
    console.log('\n2. Creating test task...');
    const { data: taskData, error: createError } = await supabase
      .from('service_tasks')
      .insert({
        title: 'Auth Delete Test',
        description: 'Testing authenticated user delete',
        priority: 'low',
        status: 'pending',
        created_by: authData.user.id
      })
      .select()
      .single();

    if (createError) {
      console.log('❌ Task creation failed:', createError.message);
      return;
    }

    console.log('✅ Task created:', taskData.id);
    console.log('Task creator:', taskData.created_by);
    console.log('Creator matches user:', taskData.created_by === authData.user.id);

    // 3. Try to delete the task
    console.log('\n3. Attempting to delete task...');
    const { data: deleteData, error: deleteError } = await supabase
      .from('service_tasks')
      .delete()
      .eq('id', taskData.id)
      .select();

    console.log('Delete error:', deleteError);
    console.log('Delete data:', deleteData);
    console.log('Delete data length:', deleteData?.length);

    // 4. Check if task still exists
    console.log('\n4. Checking if task still exists...');
    const { data: checkData, error: checkError } = await supabase
      .from('service_tasks')
      .select('*')
      .eq('id', taskData.id);

    console.log('Check error:', checkError);
    console.log('Check data:', checkData);
    console.log('Task still exists:', checkData?.length > 0);

    // 5. Try with a different approach - using the client with auth headers
    console.log('\n5. Trying with authenticated client...');
    
    // Create a new client instance with the auth session
    const authSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        global: {
          headers: {
            Authorization: `Bearer ${authData.session.access_token}`
          }
        }
      }
    );

    const { data: authDeleteData, error: authDeleteError } = await authSupabase
      .from('service_tasks')
      .delete()
      .eq('id', taskData.id)
      .select();

    console.log('Auth client delete error:', authDeleteError);
    console.log('Auth client delete data:', authDeleteData);

    // 6. Final check
    const { data: finalCheck } = await supabase
      .from('service_tasks')
      .select('id')
      .eq('id', taskData.id);

    if (finalCheck.length === 0) {
      console.log('✅ Task successfully deleted');
    } else {
      console.log('❌ Task still exists');
      
      // Clean up with service role
      const serviceSupabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );
      
      await serviceSupabase
        .from('service_tasks')
        .delete()
        .eq('id', taskData.id);
      
      console.log('🧹 Cleaned up with service role');
    }

    await supabase.auth.signOut();

  } catch (error) {
    console.log('❌ Test error:', error.message);
  }

  console.log('\n✨ Auth user delete test completed!');
}

testAuthUserDelete().catch(console.error);