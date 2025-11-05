#!/usr/bin/env node

/**
 * Check Status Values
 * Checks what status values are currently allowed
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkStatusValues() {
  console.log('🔍 Checking current status values...\n');

  try {
    // Get existing tasks to see what statuses are in use
    console.log('1. Checking existing task statuses...');
    const { data: tasks, error: tasksError } = await supabase
      .from('service_tasks')
      .select('status')
      .limit(10);

    if (tasksError) {
      console.log('❌ Error fetching tasks:', tasksError.message);
    } else {
      const statuses = [...new Set(tasks.map(task => task.status))];
      console.log('✅ Current statuses in use:', statuses);
    }

    // Test each status value
    const statusesToTest = ['pending', 'in_progress', 'completed', 'cancelled', 'awaiting_review'];
    
    console.log('\n2. Testing status values...');
    for (const status of statusesToTest) {
      try {
        const { data, error } = await supabase
          .from('service_tasks')
          .insert({
            title: `Test ${status} Status`,
            description: `Testing ${status} status`,
            priority: 'low',
            status: status,
            created_by: '00000000-0000-0000-0000-000000000000'
          })
          .select()
          .single();

        if (error) {
          console.log(`❌ ${status}: ${error.message}`);
        } else {
          console.log(`✅ ${status}: ALLOWED`);
          // Clean up
          await supabase.from('service_tasks').delete().eq('id', data.id);
        }
      } catch (err) {
        console.log(`❌ ${status}: ${err.message}`);
      }
    }

  } catch (error) {
    console.log('❌ Error checking status values:', error.message);
  }

  console.log('\n✨ Status check completed!');
}

checkStatusValues().catch(console.error);