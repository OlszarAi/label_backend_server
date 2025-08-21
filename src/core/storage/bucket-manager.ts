/**
 * Supabase Storage Manager
 * Handles file uploads, thumbnails, and bucket operations
 */

import { supabaseAdmin } from '../database/supabase';
import { Logger } from '../../utils/logger';

// Storage bucket names
export const STORAGE_BUCKETS = {
  THUMBNAILS: 'thumbnails',
  ASSETS: 'assets',
  EXPORTS: 'exports',
  USER_ASSETS: 'user-assets'
} as const;

type StorageBucket = typeof STORAGE_BUCKETS[keyof typeof STORAGE_BUCKETS];

interface UploadOptions {
  bucket: StorageBucket;
  path: string;
  file: Buffer | Uint8Array | File;
  contentType?: string;
  cacheControl?: string;
  upsert?: boolean;
}

interface ThumbnailUploadOptions {
  labelId: string;
  dataURL: string;
  size?: 'sm' | 'md' | 'lg';
  quality?: number;
}

export class StorageManager {
  /**
   * Initialize storage buckets if they don't exist
   */
  static async initializeBuckets(): Promise<void> {
    try {
      Logger.info('🗂️  Initializing storage buckets...');
      
      // Check if Supabase is configured
      if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        Logger.info('⚠️  Supabase not configured - skipping bucket initialization');
        return;
      }
      
      for (const bucketName of Object.values(STORAGE_BUCKETS)) {
        const { data: existingBucket } = await supabaseAdmin.storage
          .getBucket(bucketName);
        
        if (!existingBucket) {
          const { error } = await supabaseAdmin.storage
            .createBucket(bucketName, {
              public: false, // Make buckets private for security
              allowedMimeTypes: bucketName === STORAGE_BUCKETS.USER_ASSETS 
                ? ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']
                : ['image/png', 'image/jpeg', 'image/webp', 'application/pdf'],
              fileSizeLimit: bucketName === STORAGE_BUCKETS.USER_ASSETS 
                ? 5 * 1024 * 1024  // 5MB for user assets
                : 10 * 1024 * 1024 // 10MB for other buckets
            });
          
          if (error) {
            Logger.error(`Failed to create bucket ${bucketName}:`, error);
          } else {
            Logger.success(`✅ Created private bucket: ${bucketName}`);
          }
        } else {
          Logger.info(`✅ Bucket exists: ${bucketName}`);
        }
      }
      
      Logger.success('🗂️  All storage buckets initialized');
    } catch (error) {
      Logger.error('❌ Failed to initialize storage buckets:', error);
      throw error;
    }
  }

  /**
   * Upload a file to Supabase Storage
   */
  static async uploadFile(options: UploadOptions): Promise<{ url: string; path: string }> {
    try {
      const { bucket, path, file, contentType, cacheControl = '3600', upsert = true } = options;
      
      const uploadOptions: any = {
        cacheControl,
        upsert
      };
      
      if (contentType) {
        uploadOptions.contentType = contentType;
      }
      
      const { data, error } = await supabaseAdmin.storage
        .from(bucket)
        .upload(path, file, uploadOptions);
      
      if (error) {
        throw new Error(`Upload failed: ${error.message}`);
      }
      
      // For private buckets, generate a signed URL (valid for 1 hour)
      const { data: signedUrlData, error: signedUrlError } = await supabaseAdmin.storage
        .from(bucket)
        .createSignedUrl(data.path, 3600); // 1 hour expiry
      
      if (signedUrlError) {
        throw new Error(`Failed to create signed URL: ${signedUrlError.message}`);
      }
      
      Logger.info(`📁 File uploaded: ${bucket}/${data.path}`);
      
      return {
        url: signedUrlData.signedUrl,
        path: data.path
      };
    } catch (error) {
      Logger.error('Failed to upload file:', error);
      throw error;
    }
  }

  /**
   * Upload thumbnail from data URL
   */
  static async uploadThumbnail(options: ThumbnailUploadOptions): Promise<{ url: string; path: string }> {
    try {
      const { labelId, dataURL, size = 'md', quality = 90 } = options;
      
      // Clean up old thumbnails for this label and size before uploading new one
      await this.cleanupOldThumbnails(labelId, size);
      
      // Convert data URL to buffer
      const base64Data = dataURL.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');
      
      // Generate organized path without timestamp (since we clean old ones)
      const path = `labels/${labelId}/${size}.png`;
      
      const result = await this.uploadFile({
        bucket: STORAGE_BUCKETS.THUMBNAILS,
        path,
        file: buffer,
        contentType: 'image/png',
        cacheControl: '86400', // 24 hours cache
        upsert: true // Replace existing file
      });
      
      Logger.info(`🖼️  Thumbnail uploaded for label ${labelId}: ${path}`);
      
      return result;
    } catch (error) {
      Logger.error(`Failed to upload thumbnail for label ${options.labelId}:`, error);
      throw error;
    }
  }

  /**
   * Generate multiple thumbnail sizes
   */
  static async uploadThumbnailSizes(
    labelId: string, 
    dataURL: string
  ): Promise<{ sm: string; md: string; lg: string }> {
    try {
      // For now, we'll upload the same image as different sizes
      // In production, you would resize the image for each size
      const [sm, md, lg] = await Promise.all([
        this.uploadThumbnail({ labelId, dataURL, size: 'sm' }),
        this.uploadThumbnail({ labelId, dataURL, size: 'md' }),
        this.uploadThumbnail({ labelId, dataURL, size: 'lg' })
      ]);
      
      return {
        sm: sm.url,
        md: md.url,
        lg: lg.url
      };
    } catch (error) {
      Logger.error(`Failed to upload thumbnail sizes for label ${labelId}:`, error);
      throw error;
    }
  }

  /**
   * Delete file from storage
   */
  static async deleteFile(bucket: StorageBucket, path: string): Promise<void> {
    try {
      const { error } = await supabaseAdmin.storage
        .from(bucket)
        .remove([path]);
      
      if (error) {
        throw new Error(`Delete failed: ${error.message}`);
      }
      
      Logger.info(`🗑️  File deleted: ${bucket}/${path}`);
    } catch (error) {
      Logger.error(`Failed to delete file ${bucket}/${path}:`, error);
      throw error;
    }
  }

  /**
   * Clean up old thumbnails for a specific label and size
   */
  static async cleanupOldThumbnails(labelId: string, size?: string): Promise<void> {
    try {
      const { data: files } = await supabaseAdmin.storage
        .from(STORAGE_BUCKETS.THUMBNAILS)
        .list(`labels/${labelId}`);
      
      if (files && files.length > 0) {
        let filesToDelete: string[] = [];
        
        if (size) {
          // Delete only files for specific size
          filesToDelete = files
            .filter((file: any) => file.name.startsWith(`${size}.`) || file.name.startsWith(`${size}_`))
            .map((file: any) => `labels/${labelId}/${file.name}`);
        } else {
          // Delete all thumbnails for this label
          filesToDelete = files.map((file: any) => `labels/${labelId}/${file.name}`);
        }
        
        if (filesToDelete.length > 0) {
          const { error } = await supabaseAdmin.storage
            .from(STORAGE_BUCKETS.THUMBNAILS)
            .remove(filesToDelete);
          
          if (error) {
            Logger.warning(`⚠️  Some files could not be deleted: ${error.message}`);
          } else {
            Logger.info(`🧹 Cleaned up ${filesToDelete.length} old thumbnails for label ${labelId}${size ? ` (${size})` : ''}`);
          }
        }
      }
    } catch (error) {
      Logger.warning(`⚠️  Failed to cleanup old thumbnails for label ${labelId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      // Don't throw error - cleanup is not critical
    }
  }

  /**
   * Delete all thumbnails for a label
   */
  static async deleteLabelThumbnails(labelId: string): Promise<void> {
    try {
      const { data: files } = await supabaseAdmin.storage
        .from(STORAGE_BUCKETS.THUMBNAILS)
        .list(`labels/${labelId}`);
      
      if (files && files.length > 0) {
        const paths = files.map((file: any) => `labels/${labelId}/${file.name}`);
        
        const { error } = await supabaseAdmin.storage
          .from(STORAGE_BUCKETS.THUMBNAILS)
          .remove(paths);
        
        if (error) {
          throw new Error(`Failed to delete thumbnails: ${error.message}`);
        }
        
        Logger.info(`🗑️  Deleted ${paths.length} thumbnails for label ${labelId}`);
      }
    } catch (error) {
      Logger.error(`Failed to delete thumbnails for label ${labelId}:`, error);
      throw error;
    }
  }

  /**
   * Get signed URL for private files
   */
  static async getSignedUrl(
    bucket: StorageBucket,
    path: string,
    expiresIn: number = 3600
  ): Promise<string> {
    try {
      const { data, error } = await supabaseAdmin.storage
        .from(bucket)
        .createSignedUrl(path, expiresIn);
      
      if (error) {
        throw new Error(`Failed to create signed URL: ${error.message}`);
      }
      
      return data.signedUrl;
    } catch (error) {
      Logger.error(`Failed to get signed URL for ${bucket}/${path}:`, error);
      throw error;
    }
  }

  /**
   * Refresh signed URL for thumbnail
   */
  static async refreshThumbnailUrl(labelId: string, size: string = 'md'): Promise<string | null> {
    try {
      const path = `labels/${labelId}/${size}.png`;
      return await this.getSignedUrl(STORAGE_BUCKETS.THUMBNAILS, path, 3600);
    } catch (error) {
      Logger.warning(`⚠️  Failed to refresh thumbnail URL for label ${labelId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return null; // Return null instead of throwing
    }
  }

  /**
   * Get file info
   */
  static async getFileInfo(bucket: StorageBucket, path: string) {
    try {
      const { data, error } = await supabaseAdmin.storage
        .from(bucket)
        .list('', {
          search: path
        });
      
      if (error) {
        throw new Error(`Failed to get file info: ${error.message}`);
      }
      
      return data?.[0] || null;
    } catch (error) {
      Logger.error(`Failed to get file info for ${bucket}/${path}:`, error);
      throw error;
    }
  }

  /**
   * Upload user asset (image)
   */
  static async uploadUserAsset(options: {
    userId: string;
    file: Buffer | Uint8Array;
    fileName: string;
    contentType: string;
  }): Promise<{ url: string; path: string; size: number }> {
    try {
      const { userId, file, fileName, contentType } = options;
      
      // Generate unique filename to avoid conflicts
      const timestamp = Date.now();
      const safeName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
      const path = `users/${userId}/${timestamp}_${safeName}`;
      
      const result = await this.uploadFile({
        bucket: STORAGE_BUCKETS.USER_ASSETS,
        path,
        file,
        contentType,
        cacheControl: '86400', // 24 hours cache
        upsert: false // Don't overwrite existing files
      });
      
      // Get file size
      const fileInfo = await this.getFileInfo(STORAGE_BUCKETS.USER_ASSETS, path);
      const fileSize = fileInfo?.metadata?.size || (file as Buffer).length || 0;
      
      Logger.info(`📁 User asset uploaded: ${path} (${fileSize} bytes)`);
      
      return {
        ...result,
        size: fileSize
      };
    } catch (error) {
      Logger.error('Failed to upload user asset:', error);
      throw error;
    }
  }

  /**
   * Delete user asset
   */
  static async deleteUserAsset(path: string): Promise<void> {
    try {
      const { error } = await supabaseAdmin.storage
        .from(STORAGE_BUCKETS.USER_ASSETS)
        .remove([path]);
      
      if (error) {
        throw new Error(`Failed to delete user asset: ${error.message}`);
      }
      
      Logger.info(`🗑️  User asset deleted: ${path}`);
    } catch (error) {
      Logger.error(`Failed to delete user asset ${path}:`, error);
      throw error;
    }
  }

  /**
   * Get signed URL for user asset
   */
  static async getUserAssetUrl(path: string, expiresIn: number = 3600): Promise<string> {
    try {
      return await this.getSignedUrl(STORAGE_BUCKETS.USER_ASSETS, path, expiresIn);
    } catch (error) {
      Logger.error(`Failed to get user asset URL for ${path}:`, error);
      throw error;
    }
  }
}

// Export types
export type { StorageBucket, UploadOptions, ThumbnailUploadOptions };
