/**
 * Cache Manager - Redis and Memory Cache
 * Provides caching functionality for improved performance
 */

import Redis from 'ioredis';
import { Logger } from '../../utils/logger';

// Cache configuration
const REDIS_URL = process.env.REDIS_URL || process.env.REDIS_PRIVATE_URL || 'redis://localhost:6379';
const CACHE_TTL = {
  USER: 300, // 5 minutes
  PROJECT: 600, // 10 minutes
  LABEL: 300, // 5 minutes
  THUMBNAIL: 3600, // 1 hour
  SESSION: 86400, // 24 hours
} as const;

export type CacheKey = keyof typeof CACHE_TTL;

// Redis client instance
let redis: Redis | null = null;

// Memory cache fallback
const memoryCache = new Map<string, { value: any; expiresAt: number }>();

export class CacheManager {
  /**
   * Initialize Redis connection
   */
  static async initialize(): Promise<void> {
    try {
      if (REDIS_URL && REDIS_URL !== 'redis://localhost:6379') {
        redis = new Redis(REDIS_URL, {
          enableReadyCheck: false,
          maxRetriesPerRequest: 3,
          lazyConnect: true,
        });

        redis.on('connect', () => {
          Logger.success('🔴 Redis connected');
        });

        redis.on('error', (error) => {
          Logger.error('Redis connection error:', error);
          redis = null; // Fall back to memory cache
        });

        await redis.connect();
        Logger.success('✅ Cache system initialized with Redis');
      } else {
        Logger.info('🔄 Using memory cache (Redis not configured)');
      }
    } catch (error) {
      Logger.error('⚠️  Redis not available, using memory cache:', error);
      redis = null;
    }
  }

  /**
   * Set cache value
   */
  static async set(
    key: string,
    value: any,
    type: CacheKey = 'USER',
    customTTL?: number
  ): Promise<void> {
    try {
      const ttl = customTTL || CACHE_TTL[type];
      const serializedValue = JSON.stringify(value);

      if (redis) {
        await redis.setex(key, ttl, serializedValue);
      } else {
        // Memory cache fallback
        const expiresAt = Date.now() + (ttl * 1000);
        memoryCache.set(key, { value: serializedValue, expiresAt });
      }
    } catch (error) {
      Logger.error(`Failed to set cache for key ${key}:`, error);
    }
  }

  /**
   * Get cache value
   */
  static async get<T = any>(key: string): Promise<T | null> {
    try {
      let serializedValue: string | null = null;

      if (redis) {
        serializedValue = await redis.get(key);
      } else {
        // Memory cache fallback
        const cached = memoryCache.get(key);
        if (cached && cached.expiresAt > Date.now()) {
          serializedValue = cached.value;
        } else if (cached) {
          memoryCache.delete(key);
        }
      }

      if (serializedValue) {
        return JSON.parse(serializedValue) as T;
      }

      return null;
    } catch (error) {
      Logger.error(`Failed to get cache for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Delete cache value
   */
  static async delete(key: string): Promise<void> {
    try {
      if (redis) {
        await redis.del(key);
      } else {
        memoryCache.delete(key);
      }
    } catch (error) {
      Logger.error(`Failed to delete cache for key ${key}:`, error);
    }
  }

  /**
   * Delete multiple cache values by pattern
   */
  static async deletePattern(pattern: string): Promise<void> {
    try {
      if (redis) {
        const keys = await redis.keys(pattern);
        if (keys.length > 0) {
          await redis.del(...keys);
        }
      } else {
        // Memory cache pattern deletion
        const keysToDelete: string[] = [];
        for (const key of memoryCache.keys()) {
          if (key.includes(pattern.replace('*', ''))) {
            keysToDelete.push(key);
          }
        }
        keysToDelete.forEach(key => memoryCache.delete(key));
      }
    } catch (error) {
      Logger.error(`Failed to delete cache pattern ${pattern}:`, error);
    }
  }

  /**
   * Check if key exists in cache
   */
  static async exists(key: string): Promise<boolean> {
    try {
      if (redis) {
        return (await redis.exists(key)) === 1;
      } else {
        const cached = memoryCache.get(key);
        return cached ? cached.expiresAt > Date.now() : false;
      }
    } catch (error) {
      Logger.error(`Failed to check cache existence for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Get or set cache value with function
   */
  static async getOrSet<T>(
    key: string,
    fetchFunction: () => Promise<T>,
    type: CacheKey = 'USER',
    customTTL?: number
  ): Promise<T> {
    try {
      // Try to get from cache first
      const cached = await this.get<T>(key);
      if (cached !== null) {
        return cached;
      }

      // Fetch new value
      const value = await fetchFunction();
      
      // Set in cache
      await this.set(key, value, type, customTTL);
      
      return value;
    } catch (error) {
      Logger.error(`Failed to get or set cache for key ${key}:`, error);
      // If cache fails, still return the fetched value
      return await fetchFunction();
    }
  }

  /**
   * Increment cache value (for counters)
   */
  static async increment(key: string, by: number = 1): Promise<number> {
    try {
      if (redis) {
        return await redis.incrby(key, by);
      } else {
        // Memory cache increment
        const cached = memoryCache.get(key);
        const currentValue = cached ? parseInt(cached.value, 10) || 0 : 0;
        const newValue = currentValue + by;
        memoryCache.set(key, { 
          value: newValue.toString(), 
          expiresAt: Date.now() + (CACHE_TTL.USER * 1000) 
        });
        return newValue;
      }
    } catch (error) {
      Logger.error(`Failed to increment cache for key ${key}:`, error);
      return 0;
    }
  }

  /**
   * Set expiration for key
   */
  static async expire(key: string, ttl: number): Promise<void> {
    try {
      if (redis) {
        await redis.expire(key, ttl);
      } else {
        const cached = memoryCache.get(key);
        if (cached) {
          memoryCache.set(key, {
            value: cached.value,
            expiresAt: Date.now() + (ttl * 1000)
          });
        }
      }
    } catch (error) {
      Logger.error(`Failed to set expiration for key ${key}:`, error);
    }
  }

  /**
   * Clean up expired memory cache entries
   */
  static cleanupMemoryCache(): void {
    const now = Date.now();
    for (const [key, { expiresAt }] of memoryCache.entries()) {
      if (expiresAt <= now) {
        memoryCache.delete(key);
      }
    }
  }

  /**
   * Get cache statistics
   */
  static async getStats(): Promise<{ type: string; keys: number; memory?: string }> {
    try {
      if (redis) {
        const info = await redis.info('memory');
        const keyCount = await redis.dbsize();
        const memoryMatch = info.match(/used_memory_human:(.+)/);
        return {
          type: 'Redis',
          keys: keyCount,
          memory: memoryMatch && memoryMatch[1] ? memoryMatch[1].trim() : 'Unknown'
        };
      } else {
        return {
          type: 'Memory',
          keys: memoryCache.size
        };
      }
    } catch (error) {
      Logger.error('Failed to get cache stats:', error);
      return { type: 'Unknown', keys: 0 };
    }
  }

  /**
   * Clear all cache
   */
  static async clear(): Promise<void> {
    try {
      if (redis) {
        await redis.flushdb();
      } else {
        memoryCache.clear();
      }
      Logger.info('🗑️  Cache cleared');
    } catch (error) {
      Logger.error('Failed to clear cache:', error);
    }
  }

  /**
   * Disconnect from Redis
   */
  static async disconnect(): Promise<void> {
    try {
      if (redis) {
        await redis.disconnect();
        redis = null;
        Logger.info('🔴 Redis disconnected');
      }
    } catch (error) {
      Logger.error('Failed to disconnect from Redis:', error);
    }
  }
}

// Helper functions for common cache keys
export const CacheKeys = {
  user: (id: string) => `user:${id}`,
  userSession: (token: string) => `session:${token}`,
  project: (id: string) => `project:${id}`,
  projectLabels: (projectId: string) => `project:${projectId}:labels`,
  label: (id: string) => `label:${id}`,
  labelThumbnail: (id: string, size: string = 'md') => `thumbnail:${id}:${size}`,
  userProjects: (userId: string) => `user:${userId}:projects`,
  userSubscription: (userId: string) => `user:${userId}:subscription`,
} as const;

// Start cleanup interval for memory cache
if (!redis) {
  setInterval(() => {
    CacheManager.cleanupMemoryCache();
  }, 60000); // Clean up every minute
}
