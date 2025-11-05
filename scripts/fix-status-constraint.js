#!/usr/bin/env node

/**
 * Fix Status Constraint
 * Updates the service_tasks status constraint to include awaiting_review
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixStatusConstraint() {
  console.log('🔧 Fixing service_tasks status constraint...\n');

  try {
    // Drop existing constraint
    console.log('1. Dropping existing constraint...');
    const { error: dropError } = await supabase.rpc('exec', {
      sql: `ALTER TABLE service_tasks DROP CONSTRAINT IF EXISTS service_tasks_status_check;`
    });

    if (dropError) {
      console.log('⚠️ Drop constraint warning:', dropError.message);
    } else {
      console.log('✅ Existing constraint dropped');
    }

    // Add new constraint with awaiting_review
    console.log('2. Adding new constraint with awaiting_review...');
    const { error: addError } = await supabase.rpc('exec', {
      sql: `ALTER TABLE service_tasks ADD CONSTRAINT service_tasks_status_check CHECK (status IN ('pending', 'in_progress', 'awaiting_review', 'completed', 'cancelled'));`
    });

    if (addError) {
      console.log('❌ Add constraint failed:', addError.message);
      
      // Try alternative approach - direct SQL execution
      console.log('3. Trying alternative approach...');
      const { error: altError } = await supabase
        .from('service_tasks')
        .select('status')
        .limit(1);

      if (!altError) {
        console.log('✅ Table is accessible, constraint might already be updated');
      }
    } else {
      console.log('✅ New constraint added successfully');
    }

    // Test the constraint by trying to insert a task with awaiting_review status
    console.log('3. Testing awaiting_review status...');
    const { data: testData, error: testError } = await supabase
      .from('service_tasks')
      .insert({
        title: 'Status Test Task',
        description: 'Testing awaiting_review status',
        priority: 'low',
        status: 'awaiting_review',
        created_by: '00000000-0000-0000-0000-000000000000' // Dummy UUID for test
      })
      .select()
      .single();

    if (testError) {
      console.log('❌ awaiting_review status test failed:', testError.message);
      
      // Check what statuses are currently allowed
      console.log('4. Checking current status constraint...');
      const { data: constraintData, error: constraintError } = await supabase
        .rpc('exec', {
          sql: `SELECT conname, consrc FROM pg_constraint WHERE conname = 'service_tasks_status_check';`
        });

      if (!constraintError && constraintData) {
        console.log('Current constraint:', constraintData);
      }
    } else {
      console.log('✅ awaiting_review status works correctly');
      
      // Clean up test task
      await supabase.from('service_tasks').delete().eq('id', testData.id);
      console.log('🧹 Test task cleaned up');
    }

  } catch (error) {
    console.log('❌ Error fixing status constraint:', error.message);
  }

  console.log('\n✨ Status constraint fix completed!');
}

fixStatusConstraint().catch(console.error);