#!/usr/bin/env node

/**
 * Simple script to insert seed data using Supabase client
 */

const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function insertSeedData() {
  console.log('🌱 Inserting seed data...');
  
  try {
    // Insert sample profiles
    console.log('👥 Inserting sample profiles...');
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert([
        {
          id: '00000000-0000-0000-0000-000000000001',
          email: 'admin@fieldservice.com',
          full_name: 'System Administrator',
          role: 'admin',
          status: 'active'
        },
        {
          id: '00000000-0000-0000-0000-000000000002',
          email: 'supervisor@fieldservice.com',
          full_name: 'Field Supervisor',
          role: 'supervisor',
          status: 'active'
        },
        {
          id: '00000000-0000-0000-0000-000000000003',
          email: 'tech1@fieldservice.com',
          full_name: 'John Technician',
          role: 'technician',
          status: 'active'
        },
        {
          id: '00000000-0000-0000-0000-000000000004',
          email: 'tech2@fieldservice.com',
          full_name: 'Jane Technician',
          role: 'technician',
          status: 'active'
        },
        {
          id: '00000000-0000-0000-0000-000000000005',
          email: 'customer@example.com',
          full_name: 'Customer User',
          role: 'customer',
          status: 'active'
        }
      ], { onConflict: 'id' });

    if (profileError) {
      console.error('❌ Error inserting profiles:', profileError.message);
    } else {
      console.log('✅ Profiles inserted successfully');
    }

    // Insert sample service tasks
    console.log('📋 Inserting sample service tasks...');
    const { error: taskError } = await supabase
      .from('service_tasks')
      .upsert([
        {
          id: '10000000-0000-0000-0000-000000000001',
          title: 'Install new HVAC system',
          description: 'Complete installation of new HVAC system in building A. Includes ductwork, unit installation, and testing.',
          status: 'pending',
          priority: 'high',
          assigned_to: '00000000-0000-0000-0000-000000000003',
          created_by: '00000000-0000-0000-0000-000000000002',
          due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          location: 'Building A, Floor 2'
        },
        {
          id: '10000000-0000-0000-0000-000000000002',
          title: 'Routine maintenance check',
          description: 'Perform routine maintenance on elevator systems. Check cables, motors, and safety systems.',
          status: 'in_progress',
          priority: 'medium',
          assigned_to: '00000000-0000-0000-0000-000000000004',
          created_by: '00000000-0000-0000-0000-000000000002',
          due_date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
          location: 'Main Building, Elevator Bank'
        },
        {
          id: '10000000-0000-0000-0000-000000000003',
          title: 'Emergency repair - Water leak',
          description: 'Urgent repair needed for water leak in basement. Potential flooding risk.',
          status: 'pending',
          priority: 'urgent',
          assigned_to: '00000000-0000-0000-0000-000000000003',
          created_by: '00000000-0000-0000-0000-000000000002',
          due_date: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
          location: 'Basement Level B1'
        }
      ], { onConflict: 'id' });

    if (taskError) {
      console.error('❌ Error inserting tasks:', taskError.message);
    } else {
      console.log('✅ Service tasks inserted successfully');
    }

    // Verify data was inserted
    const { data: profiles, error: verifyError } = await supabase
      .from('profiles')
      .select('email, role')
      .limit(5);

    if (verifyError) {
      console.error('❌ Error verifying data:', verifyError.message);
    } else {
      console.log('\n🎉 Seed data inserted successfully!');
      console.log('👥 Sample profiles:');
      profiles.forEach(profile => {
        console.log(`   - ${profile.email} (${profile.role})`);
      });
    }

  } catch (error) {
    console.error('❌ Error inserting seed data:', error.message);
    process.exit(1);
  }
}

insertSeedData();