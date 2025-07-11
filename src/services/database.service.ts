import { PrismaClient } from '@prisma/client';
import { Logger } from '../utils/logger';

// Global variable to store Prisma client instance
declare global {
  var __prisma: PrismaClient | undefined;
}

// Create Prisma client instance
const createPrismaClient = () => {
  return new PrismaClient({
    log: ['info', 'warn', 'error'],
    errorFormat: 'pretty',
  });
};

// Use global variable in development to prevent multiple instances
export const prisma = globalThis.__prisma || createPrismaClient();

if (process.env.NODE_ENV === 'development') {
  globalThis.__prisma = prisma;
}

// Database connection function
export async function connectDatabase() {
  try {
    await prisma.$connect();
    
    // Test the connection with a simple query
    await prisma.$queryRaw`SELECT 1`;
    
    Logger.database('🗄️  PostgreSQL connection established');
    Logger.database('🔧 Prisma ORM initialized (9 connection pool)');
  } catch (error) {
    Logger.error('❌ Database connection failed', error);
    throw error;
  }
}

// Graceful disconnect
export async function disconnectDatabase() {
  try {
    Logger.info('🔄 Disconnecting from database...');
    await prisma.$disconnect();
    Logger.success('✅ Database disconnected successfully');
  } catch (error) {
    Logger.error('❌ Database disconnection failed', error);
    throw error;
  }
}
