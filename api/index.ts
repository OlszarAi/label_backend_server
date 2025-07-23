import { VercelRequest, VercelResponse } from '@vercel/node';
import dotenv from 'dotenv';
import { app } from '../src/app';
import { connectDatabase } from '../src/services/database.service';
import { Logger } from '../src/utils/logger';

// Load environment variables
dotenv.config();

let isInitialized = false;

async function initializeServer() {
  if (isInitialized) return;
  
  try {
    Logger.info('🔄 Initializing Vercel serverless function...');
    
    // Connect to database
    await connectDatabase();
    Logger.success('✅ Database connected successfully');
    
    isInitialized = true;
  } catch (error) {
    Logger.error('❌ Failed to initialize server', error);
    throw error;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Initialize server on first request
    await initializeServer();
    
    // Handle the request with Express app
    return app(req, res);
  } catch (error) {
    Logger.error('❌ Error in Vercel handler', error);
    return res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'Failed to process request'
    });
  }
}
