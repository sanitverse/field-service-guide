#!/usr/bin/env node

/**
 * Test Supabase connection and check if tables exist
 */

const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  console.log('🔗 Testing Supabase connection...');
  console.log(`📍 URL: ${supabaseUrl}`);
  
  try {
    // Test basic connection by checking if we can query the profiles table
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);

    if (error) {
      console.error('❌ Error connecting to profiles table:', error.message);
      
      // Check if it's a table not found error
      if (error.message.includes('relation "public.profiles" does not exist')) {
        console.log('📋 The profiles table does not exist. Migrations may not have been applied.');
        return false;
      }
    } else {
      console.log('✅ Successfully connected to Supabase!');
      console.log('✅ Profiles table exists and is accessible');
      return true;
    }

    // Test service_tasks table
    const { data: tasksData, error: tasksError } = await supabase
      .from('service_tasks')
      .select('count')
      .limit(1);

    if (tasksError) {
      console.error('❌ Error connecting to service_tasks table:', tasksError.message);
    } else {
      console.log('✅ Service tasks table exists and is accessible');
    }

    // Test storage buckets
    const { data: bucketsData, error: bucketsError } = await supabase
      .storage
      .listBuckets();

    if (bucketsError) {
      console.error('❌ Error accessing storage:', bucketsError.message);
    } else {
      console.log('✅ Storage is accessible');
      console.log('📦 Available buckets:', bucketsData.map(b => b.name).join(', '));
    }

    return true;

  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
    return false;
  }
}

async function main() {
  const connected = await testConnection();
  
  if (connected) {
    console.log('\n🎉 Supabase is properly configured and connected!');
    console.log('🚀 You can now run: npm run dev');
  } else {
    console.log('\n❌ Supabase connection failed. Please check your configuration.');
  }
}

main();