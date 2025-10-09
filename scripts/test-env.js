#!/usr/bin/env node
// Environment Test Script for TOTL Agency
// This script tests if all required environment variables are properly configured

const requiredVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'RESEND_API_KEY'
];

const optionalVars = [
  'NEXT_PUBLIC_APP_URL',
  'NEXT_PUBLIC_APP_NAME',
  'NODE_ENV'
];

console.log('🔍 TOTL Agency - Environment Test');
console.log('==================================\n');

// Load environment variables
const dotenv = require('dotenv'); // eslint-disable-line @typescript-eslint/no-require-imports
dotenv.config({ path: '.env.local' });

let allGood = true;

// Check required variables
console.log('📋 Required Variables:');
requiredVars.forEach(varName => {
  const value = process.env[varName];
  if (value && value !== `your-${varName.toLowerCase().replace(/_/g, '-')}-here`) {
    console.log(`  ✅ ${varName}: Set`);
  } else {
    console.log(`  ❌ ${varName}: Missing or placeholder`);
    allGood = false;
  }
});

console.log('\n📋 Optional Variables:');
optionalVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`  ✅ ${varName}: ${value}`);
  } else {
    console.log(`  ⚠️  ${varName}: Not set (using default)`);
  }
});

console.log('\n🔧 Configuration Test:');

// Test Supabase URL format
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
if (supabaseUrl && supabaseUrl.includes('supabase.co')) {
  console.log('  ✅ Supabase URL format looks correct');
} else if (supabaseUrl) {
  console.log('  ⚠️  Supabase URL format might be incorrect');
  allGood = false;
}

// Test API key formats
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (anonKey && anonKey.startsWith('eyJ')) {
  console.log('  ✅ Supabase anon key format looks correct');
} else if (anonKey) {
  console.log('  ⚠️  Supabase anon key format might be incorrect');
  allGood = false;
}

const resendKey = process.env.RESEND_API_KEY;
if (resendKey && resendKey.startsWith('re_')) {
  console.log('  ✅ Resend API key format looks correct');
} else if (resendKey) {
  console.log('  ⚠️  Resend API key format might be incorrect');
  allGood = false;
}

console.log('\n📊 Summary:');
if (allGood) {
  console.log('🎉 All required environment variables are properly configured!');
  console.log('🚀 You can now run: npm run dev');
} else {
  console.log('❌ Some environment variables are missing or incorrect.');
  console.log('📝 Please check your .env.local file and update the values.');
  console.log('🔗 See docs/ENVIRONMENT_SETUP.md for detailed instructions.');
  process.exit(1);
}
