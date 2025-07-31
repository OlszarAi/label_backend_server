/**
 * Unified Asset Service
 * Simplified, unified service for managing all asset operations (user assets, thumbnails)
 */

import { PrismaClient } from '@prisma/client';
import { Logger } from '../utils/logger';
import { StorageManager } from '../core/storage/bucket-manager';
import sharp from 'sharp';

export interface UserAsset {
  id: string;
  name: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  width: number | null;
  height: number | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  url: string;
}

export interface AssetUploadOptions {
  userId: string;
  file: Buffer;
  fileName: string;
  name: string;
  mimeType: string;
}

export interface AssetStats {
  totalAssets: number;
  totalSize: number;
  byMimeType: Record<string, number>;
}

export class UnifiedAssetService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Upload a new user asset with automatic optimization
   */
  async uploadAsset(options: AssetUploadOptions): Promise<UserAsset> {
    const { userId, file, fileName, name, mimeType } = options;

    try {
      // Get image dimensions and optimize if needed
      let processedBuffer = file;
      let width: number | null = null;
      let height: number | null = null;

      if (mimeType.startsWith('image/')) {
        try {
          const metadata = await sharp(file).metadata();
          width = metadata.width || null;
          height = metadata.height || null;

          // Optimize image: resize if too large, convert to WebP for better compression
          if (width && height && (width > 2048 || height > 2048)) {
            Logger.info(`📏 Resizing large image: ${width}x${height} -> max 2048px`);
            processedBuffer = await sharp(file)
              .resize(2048, 2048, { 
                fit: 'inside', 
                withoutEnlargement: true 
              })
              .webp({ quality: 85 })
              .toBuffer();
            
            // Update metadata after processing
            const newMetadata = await sharp(processedBuffer).metadata();
            width = newMetadata.width || null;
            height = newMetadata.height || null;
          }
        } catch (imageError) {
          Logger.warning(`Failed to process image metadata: ${imageError instanceof Error ? imageError.message : 'Unknown error'}`);
          // Continue with original file if processing fails
        }
      }

      // Upload to Supabase Storage
      const uploadResult = await StorageManager.uploadUserAsset({
        userId,
        file: processedBuffer,
        fileName,
        contentType: mimeType,
      });

      // Create database record
      const asset = await this.prisma.userAsset.create({
        data: {
          userId,
          name,
          fileName,
          filePath: uploadResult.path,
          fileSize: uploadResult.size,
          mimeType,
          width,
          height,
          isActive: true,
        },
      });

      // Return with public URL (proxy URL for CORS)
      return {
        ...asset,
        url: this.getProxyUrl(asset.id),
      };

    } catch (error) {
      Logger.error('Failed to upload asset:', error);
      throw new Error(`Failed to upload asset: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get all user assets with proxy URLs
   */
  async getUserAssets(userId: string): Promise<UserAsset[]> {
    try {
      const assets = await this.prisma.userAsset.findMany({
        where: {
          userId,
          isActive: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      // Add proxy URLs to avoid CORS issues
      return assets.map(asset => ({
        ...asset,
        url: this.getProxyUrl(asset.id),
      }));

    } catch (error) {
      Logger.error(`Failed to get user assets for user ${userId}:`, error);
      throw new Error('Failed to retrieve assets');
    }
  }

  /**
   * Get single asset by ID (public method for proxy)
   */
  async getAssetById(assetId: string): Promise<UserAsset | null> {
    try {
      const asset = await this.prisma.userAsset.findUnique({
        where: { id: assetId, isActive: true },
      });

      if (!asset) {
        return null;
      }

      // Get signed URL from Supabase for actual file access
      const signedUrl = await StorageManager.getUserAssetUrl(asset.filePath);

      return {
        ...asset,
        url: signedUrl, // Use signed URL for direct access
      };

    } catch (error) {
      Logger.error(`Failed to get asset ${assetId}:`, error);
      return null;
    }
  }

  /**
   * Delete user asset
   */
  async deleteAsset(assetId: string, userId: string): Promise<void> {
    try {
      const asset = await this.prisma.userAsset.findFirst({
        where: { id: assetId, userId },
      });

      if (!asset) {
        throw new Error('Asset not found or not owned by user');
      }

      // Delete from storage
      await StorageManager.deleteUserAsset(asset.filePath);

      // Soft delete from database
      await this.prisma.userAsset.update({
        where: { id: assetId },
        data: { isActive: false },
      });

      Logger.info(`🗑️ Asset deleted: ${asset.name} (${assetId})`);

    } catch (error) {
      Logger.error(`Failed to delete asset ${assetId}:`, error);
      throw new Error(`Failed to delete asset: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update asset name
   */
  async updateAsset(assetId: string, userId: string, updates: { name?: string }): Promise<UserAsset> {
    try {
      const asset = await this.prisma.userAsset.findFirst({
        where: { id: assetId, userId, isActive: true },
      });

      if (!asset) {
        throw new Error('Asset not found or not owned by user');
      }

      const updatedAsset = await this.prisma.userAsset.update({
        where: { id: assetId },
        data: {
          ...updates,
          updatedAt: new Date(),
        },
      });

      return {
        ...updatedAsset,
        url: this.getProxyUrl(asset.id),
      };

    } catch (error) {
      Logger.error(`Failed to update asset ${assetId}:`, error);
      throw new Error(`Failed to update asset: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get asset statistics for user
   */
  async getAssetStats(userId: string): Promise<AssetStats> {
    try {
      const assets = await this.prisma.userAsset.findMany({
        where: { userId, isActive: true },
        select: { fileSize: true, mimeType: true },
      });

      const totalAssets = assets.length;
      const totalSize = assets.reduce((sum, asset) => sum + asset.fileSize, 0);
      const byMimeType: Record<string, number> = {};

      assets.forEach(asset => {
        byMimeType[asset.mimeType] = (byMimeType[asset.mimeType] || 0) + 1;
      });

      return {
        totalAssets,
        totalSize,
        byMimeType,
      };

    } catch (error) {
      Logger.error(`Failed to get asset stats for user ${userId}:`, error);
      throw new Error('Failed to get asset statistics');
    }
  }

  /**
   * Generate proxy URL for CORS-free access
   */
  private getProxyUrl(assetId: string): string {
    const baseUrl = process.env.API_BASE_URL || 'http://localhost:3001';
    return `${baseUrl}/api/assets/${assetId}/proxy`;
  }
}
