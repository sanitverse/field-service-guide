#!/usr/bin/env node

/**
 * Setup script for Supabase local development
 * This script helps initialize the local Supabase instance with proper configuration
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up Supabase for Field Service Guide...\n');

// Check if Supabase CLI is installed
try {
  execSync('supabase --version', { stdio: 'pipe' });
  console.log('✅ Supabase CLI is installed');
} catch (error) {
  console.error('❌ Supabase CLI is not installed. Please install it first:');
  console.error('npm install -g supabase');
  process.exit(1);
}

// Check if Docker is running
try {
  execSync('docker info', { stdio: 'pipe' });
  console.log('✅ Docker is running');
} catch (error) {
  console.error('❌ Docker is not running. Please start Docker first.');
  process.exit(1);
}

// Initialize Supabase if not already initialized
if (!fs.existsSync('supabase/config.toml')) {
  console.log('📝 Initializing Supabase project...');
  execSync('supabase init', { stdio: 'inherit' });
} else {
  console.log('✅ Supabase project already initialized');
}

// Start Supabase local development
console.log('🔄 Starting Supabase local development server...');
try {
  execSync('supabase start', { stdio: 'inherit' });
  console.log('✅ Supabase local server started successfully');
} catch (error) {
  console.error('❌ Failed to start Supabase local server');
  process.exit(1);
}

// Run migrations
console.log('🔄 Running database migrations...');
try {
  execSync('supabase db reset', { stdio: 'inherit' });
  console.log('✅ Database migrations completed');
} catch (error) {
  console.error('❌ Failed to run migrations');
  process.exit(1);
}

// Get local Supabase credentials
console.log('\n📋 Getting local Supabase credentials...');
try {
  const status = execSync('supabase status', { encoding: 'utf8' });
  console.log(status);
  
  console.log('\n🔧 Next steps:');
  console.log('1. Copy the API URL and anon key from above');
  console.log('2. Create a .env.local file with:');
  console.log('   NEXT_PUBLIC_SUPABASE_URL=<API URL>');
  console.log('   NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>');
  console.log('   SUPABASE_SERVICE_ROLE_KEY=<service_role key>');
  console.log('3. Add your OpenAI API key:');
  console.log('   OPENAI_API_KEY=<your_openai_key>');
  console.log('\n🎉 Supabase setup complete! You can now run: npm run dev');
  
} catch (error) {
  console.error('❌ Failed to get Supabase status');
  process.exit(1);
}