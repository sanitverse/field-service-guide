#!/usr/bin/env node

/**
 * Check Delete Permissions
 * Checks RLS policies and permissions for task deletion
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkDeletePermissions() {
  console.log('🔍 Checking Task Delete Permissions\n');

  try {
    // 1. Check if RLS is enabled on service_tasks
    console.log('1. Checking RLS status...');
    const { data: rlsData, error: rlsError } = await supabase
      .rpc('exec', {
        sql: `SELECT relname, relrowsecurity FROM pg_class WHERE relname = 'service_tasks';`
      });

    if (rlsError) {
      console.log('⚠️ Could not check RLS status:', rlsError.message);
    } else {
      console.log('✅ RLS status checked');
    }

    // 2. Try to delete using service role (should bypass RLS)
    console.log('\n2. Testing delete with service role...');
    
    // Get a real user ID first
    const { data: userData } = await supabase
      .from('profiles')
      .select('id')
      .limit(1)
      .single();

    if (!userData) {
      console.log('❌ No users found in profiles table');
      return;
    }

    // First create a test task
    const { data: taskData, error: createError } = await supabase
      .from('service_tasks')
      .insert({
        title: 'Service Role Delete Test',
        description: 'Testing delete with service role',
        priority: 'low',
        status: 'pending',
        created_by: userData.id
      })
      .select()
      .single();

    if (createError) {
      console.log('❌ Could not create test task:', createError.message);
      return;
    }
    console.log('✅ Test task created:', taskData.id);

    // Try to delete it
    const { error: deleteError } = await supabase
      .from('service_tasks')
      .delete()
      .eq('id', taskData.id);

    if (deleteError) {
      console.log('❌ Service role delete failed:', deleteError.message);
    } else {
      console.log('✅ Service role delete succeeded');
    }

    // Verify deletion
    const { data: verifyData } = await supabase
      .from('service_tasks')
      .select('id')
      .eq('id', taskData.id);

    if (verifyData.length === 0) {
      console.log('✅ Task successfully deleted');
    } else {
      console.log('❌ Task still exists after delete');
    }

    // 3. Check for foreign key constraints that might prevent deletion
    console.log('\n3. Checking for related records...');
    
    // Check for comments
    const { data: commentsData } = await supabase
      .from('task_comments')
      .select('id')
      .eq('task_id', taskData.id);
    
    console.log(`Found ${commentsData?.length || 0} related comments`);

    // Check for files
    const { data: filesData } = await supabase
      .from('files')
      .select('id')
      .eq('related_task_id', taskData.id);
    
    console.log(`Found ${filesData?.length || 0} related files`);

  } catch (error) {
    console.log('❌ Error checking delete permissions:', error.message);
  }

  console.log('\n✨ Delete permissions check completed!');
}

checkDeletePermissions().catch(console.error);