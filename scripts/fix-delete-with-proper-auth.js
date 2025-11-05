#!/usr/bin/env node

/**
 * Fix Delete with Proper Auth
 * Uses the proper anon key for authenticated operations
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function fixDeleteWithProperAuth() {
  console.log('🔧 Fixing Delete with Proper Authentication\n');

  try {
    // 1. Create client with anon key (proper for auth operations)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    // 2. Login as admin
    console.log('1. Logging in with anon key client...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'admin.fieldservice@yopmail.com',
      password: 'Admin@12345'
    });

    if (authError) {
      console.log('❌ Login failed:', authError.message);
      return;
    }

    console.log('✅ Logged in as:', authData.user.email);
    console.log('Session exists:', !!authData.session);

    // 3. Create a test task
    console.log('\n2. Creating test task...');
    const { data: taskData, error: createError } = await supabase
      .from('service_tasks')
      .insert({
        title: 'Proper Auth Delete Test',
        description: 'Testing delete with proper authentication',
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

    // 4. Try to delete the task
    console.log('\n3. Attempting to delete task with proper auth...');
    const { data: deleteData, error: deleteError } = await supabase
      .from('service_tasks')
      .delete()
      .eq('id', taskData.id)
      .select();

    if (deleteError) {
      console.log('❌ Delete failed:', deleteError.message);
    } else {
      console.log('✅ Delete response:', deleteData);
      console.log('Delete data length:', deleteData.length);
    }

    // 5. Check if task still exists
    console.log('\n4. Verifying deletion...');
    const { data: checkData } = await supabase
      .from('service_tasks')
      .select('id')
      .eq('id', taskData.id);

    if (checkData.length === 0) {
      console.log('✅ Task successfully deleted with proper auth!');
    } else {
      console.log('❌ Task still exists');
      
      // If it still exists, let's check the current RLS policies
      console.log('\n5. Checking current auth context...');
      
      // Try to get current user
      const { data: { user } } = await supabase.auth.getUser();
      console.log('Current user:', user?.id);
      console.log('Task creator:', taskData.created_by);
      console.log('User matches creator:', user?.id === taskData.created_by);
      
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
    console.log('❌ Error:', error.message);
  }

  console.log('\n✨ Proper auth delete test completed!');
}

fixDeleteWithProperAuth().catch(console.error);