#!/usr/bin/env node

/**
 * Check Current Policies
 * Lists all current RLS policies for service_tasks table
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkCurrentPolicies() {
  console.log('🔍 Checking Current RLS Policies\n');

  try {
    // Method 1: Try to query policies directly
    console.log('1. Attempting to query pg_policies...');
    const { data: policiesData, error: policiesError } = await supabase
      .from('pg_policies')
      .select('policyname, cmd, qual, with_check')
      .eq('tablename', 'service_tasks');

    if (policiesError) {
      console.log('❌ Could not query pg_policies:', policiesError.message);
    } else {
      console.log('✅ Found policies:');
      policiesData.forEach(policy => {
        console.log(`  - ${policy.policyname} (${policy.cmd})`);
      });
    }

    // Method 2: Test delete with different approaches
    console.log('\n2. Testing delete approaches...');
    
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
        title: 'Policy Test Task',
        description: 'Testing policies',
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

    // Test 1: Regular delete
    console.log('\n3. Testing regular delete...');
    const { data: deleteData, error: deleteError } = await supabase
      .from('service_tasks')
      .delete()
      .eq('id', taskData.id)
      .select();

    if (deleteError) {
      console.log('❌ Regular delete failed:', deleteError.message);
    } else {
      console.log('✅ Regular delete response:', deleteData);
    }

    // Check if task still exists
    const { data: checkData } = await supabase
      .from('service_tasks')
      .select('id, title')
      .eq('id', taskData.id);

    if (checkData.length === 0) {
      console.log('✅ Task successfully deleted');
    } else {
      console.log('❌ Task still exists:', checkData[0]);
      
      // Try to delete again with service role client
      console.log('\n4. Trying with service role client...');
      const serviceSupabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );

      const { error: serviceDeleteError } = await serviceSupabase
        .from('service_tasks')
        .delete()
        .eq('id', taskData.id);

      if (serviceDeleteError) {
        console.log('❌ Service role delete failed:', serviceDeleteError.message);
      } else {
        console.log('✅ Service role delete succeeded');
      }

      // Final check
      const { data: finalCheck } = await serviceSupabase
        .from('service_tasks')
        .select('id')
        .eq('id', taskData.id);

      if (finalCheck.length === 0) {
        console.log('✅ Task finally deleted with service role');
      } else {
        console.log('❌ Task still exists even with service role');
      }
    }

    await supabase.auth.signOut();

  } catch (error) {
    console.log('❌ Error checking policies:', error.message);
  }

  console.log('\n✨ Policy check completed!');
}

checkCurrentPolicies().catch(console.error);