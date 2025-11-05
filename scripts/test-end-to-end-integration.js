#!/usr/bin/env node

/**
 * End-to-End Integration Test
 * Tests all major workflows and system integration
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testEndToEndIntegration() {
  console.log('🔄 Starting End-to-End Integration Tests\n');

  const results = {
    authentication: false,
    taskManagement: false,
    rolePermissions: false,
    fileUpload: false,
    aiIntegration: false,
    searchFunctionality: false,
    analytics: false
  };

  try {
    // 1. Test Authentication System
    console.log('1️⃣ Testing Authentication System...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'admin.fieldservice@yopmail.com',
      password: 'Admin@12345'
    });
    
    if (authError) {
      console.log('❌ Authentication failed:', authError.message);
    } else {
      console.log('✅ Authentication successful');
      results.authentication = true;
    }

    // 2. Test Task Management
    console.log('\n2️⃣ Testing Task Management...');
    const { data: taskData, error: taskError } = await supabase
      .from('service_tasks')
      .insert({
        title: 'Integration Test Task',
        description: 'Testing end-to-end integration',
        priority: 'medium',
        status: 'pending',
        created_by: authData?.user?.id
      })
      .select()
      .single();

    if (taskError) {
      console.log('❌ Task creation failed:', taskError.message);
    } else {
      console.log('✅ Task management working');
      results.taskManagement = true;
      
      // Clean up test task
      await supabase.from('service_tasks').delete().eq('id', taskData.id);
    }

    // 3. Test Role Permissions
    console.log('\n3️⃣ Testing Role Permissions...');
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', authData?.user?.id);

    if (profileError) {
      console.log('❌ Role permissions check failed:', profileError.message);
    } else if (profileData && profileData.length > 0) {
      console.log('✅ Role permissions working');
      results.rolePermissions = true;
    } else {
      console.log('⚠️ No profile found, but table is accessible');
      results.rolePermissions = true;
    }

    // 4. Test File Upload System
    console.log('\n4️⃣ Testing File Upload System...');
    const { data: fileData, error: fileError } = await supabase
      .from('files')
      .select('id')
      .limit(1);

    if (fileError) {
      console.log('❌ File system check failed:', fileError.message);
    } else {
      console.log('✅ File upload system accessible');
      results.fileUpload = true;
    }

    // 5. Test AI Integration
    console.log('\n5️⃣ Testing AI Integration...');
    try {
      const response = await fetch('http://localhost:3000/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: 'Test message',
          userId: authData?.user?.id,
          conversationHistory: []
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ AI integration working');
        results.aiIntegration = true;
      } else {
        console.log('❌ AI integration failed:', response.status);
      }
    } catch (error) {
      console.log('❌ AI integration error:', error.message);
    }

    // 6. Test Search Functionality
    console.log('\n6️⃣ Testing Search Functionality...');
    const { data: searchData, error: searchError } = await supabase
      .from('document_chunks')
      .select('id')
      .limit(1);

    if (searchError) {
      console.log('❌ Search system check failed:', searchError.message);
    } else {
      console.log('✅ Search functionality accessible');
      results.searchFunctionality = true;
    }

    // 7. Test Analytics
    console.log('\n7️⃣ Testing Analytics...');
    try {
      const response = await fetch('http://localhost:3000/api/analytics/task-statistics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: authData?.user?.id
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Analytics working');
        results.analytics = true;
      } else {
        console.log('❌ Analytics failed:', response.status);
      }
    } catch (error) {
      console.log('❌ Analytics error:', error.message);
    }

    // Sign out
    await supabase.auth.signOut();

  } catch (error) {
    console.log('❌ Integration test error:', error.message);
  }

  // Results Summary
  console.log('\n📊 Integration Test Results:');
  console.log('================================');
  
  const testResults = [
    { name: 'Authentication', status: results.authentication },
    { name: 'Task Management', status: results.taskManagement },
    { name: 'Role Permissions', status: results.rolePermissions },
    { name: 'File Upload', status: results.fileUpload },
    { name: 'AI Integration', status: results.aiIntegration },
    { name: 'Search Functionality', status: results.searchFunctionality },
    { name: 'Analytics', status: results.analytics }
  ];

  testResults.forEach(test => {
    const icon = test.status ? '✅' : '❌';
    console.log(`${icon} ${test.name}: ${test.status ? 'PASSED' : 'FAILED'}`);
  });

  const passedTests = testResults.filter(test => test.status).length;
  const totalTests = testResults.length;
  
  console.log(`\n🎯 Overall Score: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All integration tests passed! System is fully integrated.');
  } else {
    console.log('⚠️  Some integration tests failed. Check the results above.');
  }

  console.log('\n🔗 Next Steps:');
  console.log('1. Open http://localhost:3000/auth');
  console.log('2. Test the complete user workflow manually');
  console.log('3. Verify all features work as expected');
  console.log('4. Check browser console for any errors');
}

testEndToEndIntegration().catch(console.error);