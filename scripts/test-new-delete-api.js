#!/usr/bin/env node

/**
 * Test New Delete API
 * Tests the new dedicated delete API endpoint
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function testNewDeleteApi() {
  console.log('🧪 Testing New Delete API\n');

  try {
    // 1. Create a client for user operations
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    // 2. Login as admin
    console.log('1. Logging in as admin...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'admin.fieldservice@yopmail.com',
      password: 'Admin@12345'
    });

    if (authError) {
      console.log('❌ Login failed:', authError.message);
      return;
    }
    console.log('✅ Logged in successfully');

    // 3. Create a test task
    console.log('\n2. Creating test task...');
    const { data: taskData, error: createError } = await supabase
      .from('service_tasks')
      .insert({
        title: 'New API Delete Test',
        description: 'Testing new delete API endpoint',
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

    // 4. Test the new DELETE API
    console.log('\n3. Testing new DELETE API...');
    const response = await fetch('http://localhost:3000/api/tasks/delete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `sb-access-token=${authData.session.access_token}; sb-refresh-token=${authData.session.refresh_token}`
      },
      body: JSON.stringify({ taskId: taskData.id }),
    });

    console.log('API Response status:', response.status);
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ API delete succeeded:', result);
    } else {
      const error = await response.json();
      console.log('❌ API delete failed:', error);
    }

    // 5. Verify deletion
    console.log('\n4. Verifying deletion...');
    const { data: checkData } = await supabase
      .from('service_tasks')
      .select('id')
      .eq('id', taskData.id);

    if (checkData.length === 0) {
      console.log('✅ Task successfully deleted through new API!');
    } else {
      console.log('❌ Task still exists after API delete');
      
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

  console.log('\n✨ New delete API test completed!');
}

testNewDeleteApi().catch(console.error);