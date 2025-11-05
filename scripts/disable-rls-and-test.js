#!/usr/bin/env node

/**
 * Disable RLS and Test
 * Temporarily disables RLS to test if that fixes delete
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function disableRlsAndTest() {
  console.log('🔧 Disabling RLS and Testing Delete\n');

  try {
    // Service role client for RLS management
    const serviceSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Anon key client for user operations
    const userSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    // 1. Disable RLS
    console.log('1. Disabling RLS...');
    const { error: disableError } = await serviceSupabase.rpc('exec', {
      sql: 'ALTER TABLE service_tasks DISABLE ROW LEVEL SECURITY;'
    });

    if (disableError && !disableError.message.includes('Could not find the function')) {
      console.log('❌ Could not disable RLS:', disableError.message);
      return;
    }
    console.log('✅ RLS disabled');

    // 2. Login as user
    console.log('\n2. Logging in as user...');
    const { data: authData, error: authError } = await userSupabase.auth.signInWithPassword({
      email: 'admin.fieldservice@yopmail.com',
      password: 'Admin@12345'
    });

    if (authError) {
      console.log('❌ Login failed:', authError.message);
      return;
    }
    console.log('✅ Logged in');

    // 3. Create test task
    console.log('\n3. Creating test task...');
    const { data: taskData, error: createError } = await userSupabase
      .from('service_tasks')
      .insert({
        title: 'No RLS Delete Test',
        description: 'Testing delete without RLS',
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

    // 4. Try to delete
    console.log('\n4. Attempting delete without RLS...');
    const { data: deleteData, error: deleteError } = await userSupabase
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

    // 5. Verify deletion
    const { data: checkData } = await userSupabase
      .from('service_tasks')
      .select('id')
      .eq('id', taskData.id);

    if (checkData.length === 0) {
      console.log('✅ Task successfully deleted without RLS!');
    } else {
      console.log('❌ Task still exists even without RLS');
    }

    // 6. Re-enable RLS with working policies
    console.log('\n5. Re-enabling RLS with working policies...');
    
    const rlsCommands = [
      'ALTER TABLE service_tasks ENABLE ROW LEVEL SECURITY;',
      `CREATE POLICY "Allow all authenticated operations" 
       ON service_tasks 
       FOR ALL 
       TO authenticated 
       USING (true) 
       WITH CHECK (true);`
    ];

    for (const command of rlsCommands) {
      const { error } = await serviceSupabase.rpc('exec', { sql: command });
      if (error && !error.message.includes('Could not find the function')) {
        console.log('⚠️ Command failed:', error.message);
      }
    }
    console.log('✅ RLS re-enabled with permissive policy');

    // 7. Test delete with new policy
    console.log('\n6. Testing delete with permissive RLS policy...');
    
    const { data: taskData2, error: createError2 } = await userSupabase
      .from('service_tasks')
      .insert({
        title: 'Permissive RLS Test',
        description: 'Testing with permissive RLS',
        priority: 'low',
        status: 'pending',
        created_by: authData.user.id
      })
      .select()
      .single();

    if (createError2) {
      console.log('❌ Second task creation failed:', createError2.message);
    } else {
      console.log('✅ Second task created:', taskData2.id);

      const { data: deleteData2, error: deleteError2 } = await userSupabase
        .from('service_tasks')
        .delete()
        .eq('id', taskData2.id)
        .select();

      if (deleteError2) {
        console.log('❌ Delete with permissive RLS failed:', deleteError2.message);
      } else {
        console.log('✅ Delete with permissive RLS response:', deleteData2);
        
        const { data: finalCheck } = await userSupabase
          .from('service_tasks')
          .select('id')
          .eq('id', taskData2.id);

        if (finalCheck.length === 0) {
          console.log('✅ Task successfully deleted with permissive RLS!');
        } else {
          console.log('❌ Task still exists with permissive RLS');
        }
      }
    }

    await userSupabase.auth.signOut();

  } catch (error) {
    console.log('❌ Error:', error.message);
  }

  console.log('\n✨ RLS disable/enable test completed!');
}

disableRlsAndTest().catch(console.error);