#!/usr/bin/env node

/**
 * Script to run seed data on the remote Supabase database
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runSeedData() {
  console.log('🌱 Running seed data...');
  
  try {
    // Read seed file
    const seedPath = path.join(__dirname, '..', 'supabase', 'seed.sql');
    const seedSQL = fs.readFileSync(seedPath, 'utf8');
    
    // Split SQL into individual statements
    const statements = seedSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        console.log(`⚡ Executing statement ${i + 1}/${statements.length}`);
        
        const { error } = await supabase.rpc('exec_sql', { 
          sql_query: statement + ';' 
        });
        
        if (error) {
          console.warn(`⚠️  Warning on statement ${i + 1}: ${error.message}`);
          // Continue with other statements even if one fails
        }
      }
    }
    
    console.log('✅ Seed data execution completed');
    
    // Verify some data was inserted
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('email, role')
      .limit(5);
      
    if (profileError) {
      console.error('❌ Error verifying profiles:', profileError.message);
    } else {
      console.log('👥 Sample profiles created:');
      profiles.forEach(profile => {
        console.log(`   - ${profile.email} (${profile.role})`);
      });
    }
    
    const { data: tasks, error: taskError } = await supabase
      .from('service_tasks')
      .select('title, status')
      .limit(5);
      
    if (taskError) {
      console.error('❌ Error verifying tasks:', taskError.message);
    } else {
      console.log('📋 Sample tasks created:');
      tasks.forEach(task => {
        console.log(`   - ${task.title} (${task.status})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error running seed data:', error.message);
    process.exit(1);
  }
}

runSeedData();