#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up GEIAL - AI Business Intelligence Platform\n');

// Check if .env file exists
const envPath = path.join(process.cwd(), '.env');
const envExamplePath = path.join(process.cwd(), 'env.example');

if (!fs.existsSync(envPath)) {
  if (fs.existsSync(envExamplePath)) {
    fs.copyFileSync(envExamplePath, envPath);
    console.log('✅ Created .env file from env.example');
  } else {
    console.log('❌ env.example file not found');
    process.exit(1);
  }
} else {
  console.log('✅ .env file already exists');
}

// Check if node_modules exists
const nodeModulesPath = path.join(process.cwd(), 'node_modules');
if (!fs.existsSync(nodeModulesPath)) {
  console.log('📦 Installing dependencies...');
  const { execSync } = require('child_process');
  try {
    execSync('npm install', { stdio: 'inherit' });
    console.log('✅ Dependencies installed successfully');
  } catch (error) {
    console.log('❌ Failed to install dependencies');
    process.exit(1);
  }
} else {
  console.log('✅ Dependencies already installed');
}

console.log('\n🎉 Setup complete! Next steps:');
console.log('1. Update your .env file with your Supabase and OpenAI credentials');
console.log('2. Set up your Supabase database using the schema in database/schema.sql');
console.log('3. Run "npm run dev" to start the development server');
console.log('4. Run "npm run netlify:dev" to start Netlify Functions locally');
console.log('\n📚 Check the README.md for detailed setup instructions');
