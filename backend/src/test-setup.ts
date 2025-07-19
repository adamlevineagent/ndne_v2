// Simple test to verify basic setup
import express from 'express';
import pool from './config/database';

async function testSetup() {
  console.log('Testing NDNE V2 Backend Setup...');
  
  // Test 1: Express app creation
  try {
    const app = express();
    console.log('✓ Express app created successfully');
  } catch (error) {
    console.error('✗ Express app creation failed:', error);
    return false;
  }
  
  // Test 2: Database connection (if available)
  try {
    await pool.query('SELECT NOW()');
    console.log('✓ Database connection successful');
  } catch (error) {
    console.log('⚠ Database connection failed (this is expected if DB is not set up yet)');
    console.log('  Error:', error instanceof Error ? error.message : String(error));
  }
  
  // Test 3: Environment variables
  const requiredEnvVars = ['JWT_SECRET', 'DATABASE_URL'];
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length === 0) {
    console.log('✓ All required environment variables are set');
  } else {
    console.log('⚠ Missing environment variables:', missingVars.join(', '));
    console.log('  Copy .env.example to .env and configure values');
  }
  
  console.log('\nSetup test completed!');
  console.log('Next steps:');
  console.log('1. Set up PostgreSQL database: createdb ndne_v2');
  console.log('2. Configure .env file with your database URL');
  console.log('3. Run migrations: npm run migrate:up');
  console.log('4. Start development server: npm run dev');
  
  process.exit(0);
}

testSetup().catch(console.error);