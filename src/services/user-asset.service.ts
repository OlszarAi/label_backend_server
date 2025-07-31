/**
 * User Asset Service
 * Handles user-uploaded graphics/logos management
 */

import { PrismaClient } from '@prisma/client';
import { StorageManager } from '../core/storage/bucket-manager';
import { Logger } from '../utils/logger';

const prisma = new PrismaClient();

export interface CreateUserAssetData {
  name: string;
  file: Buffer;
  fileName: string;
  mimeType: string;
  userId: string;
}

export interface UserAssetWithUrl {
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

export class UserAssetService {
  /**
   * Create a new user asset
   */
  static async createUserAsset(data: CreateUserAssetData): Promise<UserAssetWithUrl> {
    try {
      const { name, file, fileName, mimeType, userId } = data;

      // For now, we'll skip image dimension detection
      // This can be added later with proper image processing library
      const width: number | null = null;
      const height: number | null = null;

      // Upload file to storage
      const uploadResult = await StorageManager.uploadUserAsset({
        userId,
        file,
        fileName,
        contentType: mimeType
      });

      // Save metadata to database
      const userAsset = await prisma.userAsset.create({
        data: {
          name,
          fileName,
          filePath: uploadResult.path,
          fileSize: uploadResult.size,
          mimeType,
          width,
          height,
          userId
        }
      });

      Logger.info(`✅ User asset created: ${userAsset.id} for user ${userId}`);

      return {
        ...userAsset,
        url: uploadResult.url
      };
    } catch (error) {
      Logger.error('Failed to create user asset:', error);
      throw error;
    }
  }

  /**
   * Get user assets with URLs
   */
  static async getUserAssets(userId: string): Promise<UserAssetWithUrl[]> {
    try {
      const assets = await prisma.userAsset.findMany({
        where: {
          userId,
          isActive: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      // Generate signed URLs for all assets
      const assetsWithUrls: UserAssetWithUrl[] = await Promise.all(
        assets.map(async (asset): Promise<UserAssetWithUrl> => {
          try {
            const url = await StorageManager.getUserAssetUrl(asset.filePath);
            return {
              ...asset,
              url
            };
          } catch (error) {
            Logger.warning(`Failed to generate URL for asset ${asset.id}`);
            return {
              ...asset,
              url: ''
            };
          }
        })
      );

      return assetsWithUrls;
    } catch (error) {
      Logger.error(`Failed to get user assets for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Get single user asset by ID
   */
  /**
   * Get user asset by asset ID and user ID
   */
  static async getUserAsset(assetId: string, userId: string): Promise<UserAssetWithUrl | null> {
    try {
      const asset = await prisma.userAsset.findFirst({
        where: {
          id: assetId,
          userId,
          isActive: true
        }
      });

      if (!asset) {
        return null;
      }

      const url = await StorageManager.getUserAssetUrl(asset.filePath);

      return {
        ...asset,
        url
      };
    } catch (error) {
      Logger.error(`Failed to get user asset ${assetId}:`, error);
      throw error;
    }
  }

  /**
   * Get asset by ID only (for public proxy access)
   */
  static async getAssetById(assetId: string): Promise<UserAssetWithUrl | null> {
    try {
      const asset = await prisma.userAsset.findFirst({
        where: {
          id: assetId,
          isActive: true
        }
      });

      if (!asset) {
        return null;
      }

      const url = await StorageManager.getUserAssetUrl(asset.filePath);

      return {
        ...asset,
        url
      };
    } catch (error) {
      Logger.error(`Failed to get asset ${assetId}:`, error);
      throw error;
    }
  }

  /**
   * Delete user asset
   */
  static async deleteUserAsset(assetId: string, userId: string): Promise<void> {
    try {
      // Find the asset
      const asset = await prisma.userAsset.findFirst({
        where: {
          id: assetId,
          userId,
          isActive: true
        }
      });

      if (!asset) {
        throw new Error('Asset not found or access denied');
      }

      // Delete from storage
      await StorageManager.deleteUserAsset(asset.filePath);

      // Mark as inactive in database (soft delete)
      await prisma.userAsset.update({
        where: { id: assetId },
        data: { isActive: false }
      });

      Logger.info(`🗑️  User asset deleted: ${assetId}`);
    } catch (error) {
      Logger.error(`Failed to delete user asset ${assetId}:`, error);
      throw error;
    }
  }

  /**
   * Update user asset name
   */
  static async updateUserAsset(
    assetId: string, 
    userId: string, 
    updates: { name?: string }
  ): Promise<UserAssetWithUrl> {
    try {
      const asset = await prisma.userAsset.findFirst({
        where: {
          id: assetId,
          userId,
          isActive: true
        }
      });

      if (!asset) {
        throw new Error('Asset not found or access denied');
      }

      const updatedAsset = await prisma.userAsset.update({
        where: { id: assetId },
        data: updates
      });

      const url = await StorageManager.getUserAssetUrl(updatedAsset.filePath);

      return {
        ...updatedAsset,
        url
      };
    } catch (error) {
      Logger.error(`Failed to update user asset ${assetId}:`, error);
      throw error;
    }
  }

  /**
   * Get asset usage statistics for user
   */
  static async getAssetStats(userId: string): Promise<{
    totalAssets: number;
    totalSize: number;
    byMimeType: Record<string, number>;
  }> {
    try {
      const assets = await prisma.userAsset.findMany({
        where: {
          userId,
          isActive: true
        },
        select: {
          fileSize: true,
          mimeType: true
        }
      });

      const totalAssets = assets.length;
      const totalSize = assets.reduce((sum: number, asset: any) => sum + asset.fileSize, 0);
      
      const byMimeType = assets.reduce((acc: Record<string, number>, asset: any) => {
        acc[asset.mimeType] = (acc[asset.mimeType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return {
        totalAssets,
        totalSize,
        byMimeType
      };
    } catch (error) {
      Logger.error(`Failed to get asset stats for user ${userId}:`, error);
      throw error;
    }
  }
}
