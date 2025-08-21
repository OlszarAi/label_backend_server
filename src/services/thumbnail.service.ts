import { Logger } from '../utils/logger';
import { StorageManager } from '../core/storage/bucket-manager';
import { LabelService } from './label.service';

export interface ThumbnailOptions {
  width: number;
  height: number;
  quality: number;
  format: 'png' | 'jpeg' | 'webp';
}

export interface ThumbnailSizes {
  sm: ThumbnailOptions;
  md: ThumbnailOptions;
  lg: ThumbnailOptions;
}

/**
 * Modern thumbnail service with optimized generation and caching
 */
export class ThumbnailService {
  // High-quality thumbnail configurations
  private static readonly THUMBNAIL_SIZES: ThumbnailSizes = {
    sm: { width: 150, height: 150, quality: 85, format: 'webp' },
    md: { width: 300, height: 300, quality: 90, format: 'webp' },
    lg: { width: 600, height: 600, quality: 95, format: 'webp' }
  };

  // Cache to avoid repeated thumbnail generation
  private static thumbnailCache = new Map<string, { url: string; expires: number }>();
  private static readonly CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

  /**
   * Get thumbnail URL with caching
   */
  static async getThumbnailUrl(labelId: string, size: keyof ThumbnailSizes = 'md'): Promise<string | null> {
    const cacheKey = `${labelId}-${size}`;
    const cached = this.thumbnailCache.get(cacheKey);
    
    // Return cached URL if still valid
    if (cached && cached.expires > Date.now()) {
      return cached.url;
    }

    try {
      // Try to get existing thumbnail
      const url = await StorageManager.refreshThumbnailUrl(labelId, size);
      
      if (url) {
        // Cache the URL
        this.thumbnailCache.set(cacheKey, {
          url,
          expires: Date.now() + this.CACHE_DURATION
        });
        return url;
      }

      // If no thumbnail exists, generate it (placeholder for now)
      Logger.info(`📝 Thumbnail for label ${labelId} (${size}) needs to be generated`);
      
      return null;
    } catch (error) {
      Logger.error(`Failed to get thumbnail for label ${labelId}: ${error}`);
      return null;
    }
  }

  /**
   * Generate thumbnail from frontend data (simplified)
   */
  static async generateThumbnail(labelId: string, dataURL: string, size: keyof ThumbnailSizes = 'md'): Promise<boolean> {
    try {
      // Get label data
      const label = await LabelService.getLabelById(labelId);
      if (!label) {
        Logger.warning(`Cannot generate thumbnail for label ${labelId}: Label not found`);
        return false;
      }

      if (!dataURL) {
        Logger.warning(`Cannot generate thumbnail for label ${labelId}: No dataURL provided`);
        return false;
      }

      // Convert data URL to buffer
      const buffer = this.dataURLToBuffer(dataURL);
      if (!buffer) {
        Logger.warning(`Failed to convert dataURL to buffer for label ${labelId}`);
        return false;
      }

      const options = this.THUMBNAIL_SIZES[size];
      
      // Upload to storage
      const path = `labels/${labelId}/${size}.${options.format}`;
      const result = await StorageManager.uploadFile({
        bucket: 'thumbnails',
        path,
        file: buffer,
        contentType: `image/${options.format}`,
        cacheControl: '3600'
      });

      if (result) {
        Logger.info(`✅ Generated thumbnail for label ${labelId} (${size})`);
        
        // Update label with thumbnail path
        await LabelService.updateThumbnail(labelId, path);
        
        // Invalidate cache to force refresh
        const cacheKey = `${labelId}-${size}`;
        this.thumbnailCache.delete(cacheKey);
        
        return true;
      }

      return false;
    } catch (error) {
      Logger.error(`Failed to generate thumbnail for label ${labelId}: ${error}`);
      return false;
    }
  }

  /**
   * Convert data URL to buffer
   */
  private static dataURLToBuffer(dataURL: string): Buffer | null {
    try {
      // Remove data:image/png;base64, prefix
      const base64Data = dataURL.split(',')[1];
      if (!base64Data) {
        return null;
      }
      
      return Buffer.from(base64Data, 'base64');
    } catch (error) {
      Logger.error(`Failed to convert dataURL to buffer: ${error}`);
      return null;
    }
  }

  /**
   * Generate thumbnails for all sizes
   */
  static async generateAllSizes(labelId: string, dataURL: string): Promise<boolean> {
    const sizes: Array<keyof ThumbnailSizes> = ['sm', 'md', 'lg'];
    const results = await Promise.all(
      sizes.map(size => this.generateThumbnail(labelId, dataURL, size))
    );
    
    return results.every(result => result === true);
  }

  /**
   * Clear thumbnail cache
   */
  static clearCache(labelId?: string): void {
    if (labelId) {
      // Clear cache for specific label
      const sizes: Array<keyof ThumbnailSizes> = ['sm', 'md', 'lg'];
      sizes.forEach(size => {
        this.thumbnailCache.delete(`${labelId}-${size}`);
      });
    } else {
      // Clear entire cache
      this.thumbnailCache.clear();
    }
  }

  /**
   * Regenerate thumbnail when label is updated
   */
  static async onLabelUpdated(labelId: string, dataURL?: string): Promise<void> {
    try {
      // Clear cache first
      this.clearCache(labelId);
      
      if (dataURL) {
        // Generate new thumbnails in background
        setImmediate(async () => {
          await this.generateAllSizes(labelId, dataURL);
          Logger.info(`🔄 Regenerated thumbnails for updated label ${labelId}`);
        });
      }
    } catch (error) {
      Logger.error(`Failed to regenerate thumbnails for label ${labelId}: ${error}`);
    }
  }
}
