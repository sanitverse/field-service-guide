#!/usr/bin/env node

/**
 * Debug Delete Issue
 * Comprehensive debugging of the delete issue
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debugDeleteIssue() {
  console.log('🐛 Debugging Delete Issue\n');

  try {
    // 1. Test with service role directly (should work)
    console.log('1. Testing with service role...');
    
    const { data: taskData, error: createError } = await supabase
      .from('service_tasks')
      .insert({
        title: 'Debug Delete Test',
        description: 'Testing delete with service role',
        priority: 'low',
        status: 'pending',
        created_by: '550e8400-e29b-41d4-a716-446655440000' // Use a fixed UUID
      })
      .select()
      .single();

    if (createError) {
      console.log('❌ Task creation failed:', createError.message);
      
      // Try to get a real user ID
      const { data: userData } = await supabase
        .from('profiles')
        .select('id')
        .limit(1)
        .single();

      if (userData) {
        console.log('Found user ID:', userData.id);
        
        const { data: taskData2, error: createError2 } = await supabase
          .from('service_tasks')
          .insert({
            title: 'Debug Delete Test 2',
            description: 'Testing delete with real user',
            priority: 'low',
            status: 'pending',
            created_by: userData.id
          })
          .select()
          .single();

        if (createError2) {
          console.log('❌ Task creation with real user failed:', createError2.message);
          return;
        } else {
          console.log('✅ Task created with real user:', taskData2.id);
          
          // Try to delete with service role
          const { data: deleteData, error: deleteError } = await supabase
            .from('service_tasks')
            .delete()
            .eq('id', taskData2.id)
            .select();

          if (deleteError) {
            console.log('❌ Service role delete failed:', deleteError.message);
          } else {
            console.log('✅ Service role delete response:', deleteData);
            
            // Check if actually deleted
            const { data: checkData } = await supabase
              .from('service_tasks')
              .select('id')
              .eq('id', taskData2.id);

            if (checkData.length === 0) {
              console.log('✅ Task actually deleted with service role');
            } else {
              console.log('❌ Task still exists even with service role');
            }
          }
        }
      }
      return;
    }

    console.log('✅ Task created:', taskData.id);

    // Try to delete with service role
    const { data: deleteData, error: deleteError } = await supabase
      .from('service_tasks')
      .delete()
      .eq('id', taskData.id)
      .select();

    if (deleteError) {
      console.log('❌ Service role delete failed:', deleteError.message);
    } else {
      console.log('✅ Service role delete response:', deleteData);
    }

    // 2. Test with authenticated user
    console.log('\n2. Testing with authenticated user...');
    
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'admin.fieldservice@yopmail.com',
      password: 'Admin@12345'
    });

    if (authError) {
      console.log('❌ Login failed:', authError.message);
      return;
    }

    console.log('✅ Logged in as:', authData.user.email);

    // Create another test task
    const { data: taskData2, error: createError2 } = await supabase
      .from('service_tasks')
      .insert({
        title: 'Auth User Delete Test',
        description: 'Testing delete with authenticated user',
        priority: 'low',
        status: 'pending',
        created_by: authData.user.id
      })
      .select()
      .single();

    if (createError2) {
      console.log('❌ Auth user task creation failed:', createError2.message);
      return;
    }

    console.log('✅ Auth user task created:', taskData2.id);

    // Try to delete with authenticated user
    const { data: authDeleteData, error: authDeleteError } = await supabase
      .from('service_tasks')
      .delete()
      .eq('id', taskData2.id)
      .select();

    if (authDeleteError) {
      console.log('❌ Auth user delete failed:', authDeleteError.message);
    } else {
      console.log('✅ Auth user delete response:', authDeleteData);
      console.log('Response length:', authDeleteData.length);
    }

    // Check if task still exists
    const { data: checkData2 } = await supabase
      .from('service_tasks')
      .select('id, created_by')
      .eq('id', taskData2.id);

    if (checkData2.length === 0) {
      console.log('✅ Task deleted by authenticated user');
    } else {
      console.log('❌ Task still exists:', checkData2[0]);
      console.log('Current user ID:', authData.user.id);
      console.log('Task creator ID:', checkData2[0].created_by);
      console.log('IDs match:', authData.user.id === checkData2[0].created_by);
    }

    // 3. Try to disable RLS completely and test
    console.log('\n3. Testing with RLS disabled...');
    
    const serviceSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Disable RLS
    const { error: disableError } = await serviceSupabase.rpc('exec', {
      sql: 'ALTER TABLE service_tasks DISABLE ROW LEVEL SECURITY;'
    });

    if (disableError && !disableError.message.includes('Could not find the function')) {
      console.log('⚠️ Could not disable RLS:', disableError.message);
    } else {
      console.log('✅ RLS disabled');
      
      // Try delete again
      const { data: noRlsDeleteData, error: noRlsDeleteError } = await supabase
        .from('service_tasks')
        .delete()
        .eq('id', taskData2.id)
        .select();

      if (noRlsDeleteError) {
        console.log('❌ Delete without RLS failed:', noRlsDeleteError.message);
      } else {
        console.log('✅ Delete without RLS response:', noRlsDeleteData);
      }

      // Check again
      const { data: finalCheck } = await supabase
        .from('service_tasks')
        .select('id')
        .eq('id', taskData2.id);

      if (finalCheck.length === 0) {
        console.log('✅ Task finally deleted without RLS');
      } else {
        console.log('❌ Task still exists even without RLS');
      }

      // Re-enable RLS
      await serviceSupabase.rpc('exec', {
        sql: 'ALTER TABLE service_tasks ENABLE ROW LEVEL SECURITY;'
      });
    }

    await supabase.auth.signOut();

  } catch (error) {
    console.log('❌ Debug error:', error.message);
  }

  console.log('\n✨ Debug completed!');
}

debugDeleteIssue().catch(console.error);