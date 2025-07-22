#!/usr/bin/env node

/**
 * Post-build script for Vercel deployment
 * Ensures Prisma client is properly generated
 */

const { execSync } = require('child_process');

console.log('🔧 Running post-build tasks...');

try {
  console.log('📦 Generating Prisma client...');
  execSync('npx prisma generate', { stdio: 'inherit' });
  console.log('✅ Prisma client generated successfully');
  
  console.log('🎉 Post-build tasks completed successfully');
} catch (error) {
  console.error('❌ Error during post-build tasks:', error.message);
  process.exit(1);
}
