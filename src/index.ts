import dotenv from 'dotenv';
import { app } from './app';
import { config } from './config/config';
import { connectDatabase } from './services/database.service';
import { Logger } from './utils/logger';
import { CacheManager } from './core/cache/cache-manager';
import { StorageManager } from './core/storage/bucket-manager';

// Load environment variables
dotenv.config();

async function startServer() {
  try {
    // Show compact startup banner
    Logger.startup();
    
    // Connect to database
    Logger.info('🔄 Connecting to PostgreSQL database...');
    await connectDatabase();
    Logger.success('✅ Database connected successfully');
    
    // Initialize cache system
    Logger.info('🔄 Initializing cache system...');
    await CacheManager.initialize();
    Logger.success('✅ Cache system initialized');
    
    // Initialize storage buckets
    Logger.info('🔄 Initializing storage buckets...');
    await StorageManager.initializeBuckets();
    Logger.success('✅ Storage buckets initialized');
    
    Logger.newLine();

    // Start server
    const server = app.listen(config.port, () => {
      Logger.ready();
      
      Logger.server(`🎉 Ready to handle requests!`);
      Logger.info(`💡 Health check: http://localhost:${config.port}/health`);
      Logger.newLine();
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      Logger.warning('⚠️  SIGTERM received, shutting down gracefully...');
      server.close(() => {
        Logger.info('✅ Server closed successfully');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      Logger.newLine();
      Logger.warning('⚠️  SIGINT received, shutting down gracefully...');
      server.close(() => {
        Logger.info('✅ Server closed successfully');
        Logger.info('👋 Thanks for using Label Backend Server!');
        process.exit(0);
      });
    });

  } catch (error) {
    Logger.error('❌ Failed to start server', error);
    process.exit(1);
  }
}

startServer();
