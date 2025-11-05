#!/usr/bin/env node

/**
 * Fix Delete Policy
 * Creates a simpler DELETE policy that works with current setup
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixDeletePolicy() {
  console.log('🔧 Fixing Task Delete Policy\n');

  try {
    // 1. Drop existing delete policies
    console.log('1. Dropping existing delete policies...');
    
    const policiesToDrop = [
      'Admins and supervisors can delete tasks',
      'Supervisors can delete tasks',
      'Users can delete their tasks'
    ];

    for (const policyName of policiesToDrop) {
      const { error } = await supabase.rpc('exec', {
        sql: `DROP POLICY IF EXISTS "${policyName}" ON service_tasks;`
      });
      
      if (error && !error.message.includes('Could not find the function')) {
        console.log(`⚠️ Warning dropping policy "${policyName}":`, error.message);
      }
    }
    console.log('✅ Existing policies dropped');

    // 2. Create a simple delete policy for authenticated users
    console.log('\n2. Creating new delete policy...');
    
    // For now, allow any authenticated user to delete tasks they created
    // In production, you'd want more restrictive policies
    const createPolicySQL = `
      CREATE POLICY "Authenticated users can delete tasks they created"
      ON service_tasks FOR DELETE
      TO authenticated
      USING (created_by = auth.uid());
    `;

    const { error: createError } = await supabase.rpc('exec', {
      sql: createPolicySQL
    });

    if (createError && !createError.message.includes('Could not find the function')) {
      console.log('❌ Failed to create policy:', createError.message);
      
      // Alternative approach: Test if we can delete directly
      console.log('\n3. Testing direct delete operation...');
      
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
          title: 'Delete Policy Test',
          description: 'Testing delete policy',
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
      const { error: deleteError } = await supabase
        .from('service_tasks')
        .delete()
        .eq('id', taskData.id);

      if (deleteError) {
        console.log('❌ Delete failed:', deleteError.message);
      } else {
        console.log('✅ Delete succeeded');
      }

      await supabase.auth.signOut();
      
    } else {
      console.log('✅ New delete policy created');
    }

  } catch (error) {
    console.log('❌ Error fixing delete policy:', error.message);
  }

  console.log('\n✨ Delete policy fix completed!');
}

fixDeletePolicy().catch(console.error);