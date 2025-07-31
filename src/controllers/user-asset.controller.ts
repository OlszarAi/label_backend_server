/**
 * User Asset Controller
 * Handles user-uploaded graphics/logos management endpoints
 */

import { Request, Response } from 'express';
import multer from 'multer';
import { UserAssetService } from '../services/user-asset.service';
import { Logger } from '../utils/logger';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req: any, file: any, cb: any) => {
    // Allow only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  },
});

export class UserAssetController {
  /**
   * Upload new user asset
   */
  static uploadAsset = [
    upload.single('file'),
    async (req: AuthenticatedRequest, res: Response): Promise<void> => {
      try {
        const userId = req.user?.id;
        if (!userId) {
          res.status(401).json({ error: 'Authentication required' });
          return;
        }

        if (!req.file) {
          res.status(400).json({ error: 'No file provided' });
          return;
        }

        const { name } = req.body;
        if (!name || typeof name !== 'string') {
          res.status(400).json({ error: 'Asset name is required' });
          return;
        }

        const userAsset = await UserAssetService.createUserAsset({
          name: name.trim(),
          file: req.file.buffer,
          fileName: req.file.originalname,
          mimeType: req.file.mimetype,
          userId
        });

        Logger.info(`📁 User asset uploaded: ${userAsset.id} by user ${userId}`);

        res.status(201).json({
          success: true,
          data: userAsset
        });
      } catch (error) {
        Logger.error('Failed to upload user asset:', error);
        res.status(500).json({
          error: 'Failed to upload asset',
          details: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  ];

  /**
   * Get user assets
   */
  static async getUserAssets(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const assets = await UserAssetService.getUserAssets(userId);

      res.json({
        success: true,
        data: assets
      });
    } catch (error) {
      Logger.error('Failed to get user assets:', error);
      res.status(500).json({
        error: 'Failed to retrieve assets',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get single user asset
   */
  static async getUserAsset(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const { assetId } = req.params;
      if (!assetId) {
        res.status(400).json({ error: 'Asset ID is required' });
        return;
      }

      const asset = await UserAssetService.getUserAsset(assetId, userId);
      if (!asset) {
        res.status(404).json({ error: 'Asset not found' });
        return;
      }

      res.json({
        success: true,
        data: asset
      });
    } catch (error) {
      Logger.error('Failed to get user asset:', error);
      res.status(500).json({
        error: 'Failed to retrieve asset',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Update user asset
   */
  static async updateUserAsset(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const { assetId } = req.params;
      if (!assetId) {
        res.status(400).json({ error: 'Asset ID is required' });
        return;
      }

      const { name } = req.body;
      const updates: { name?: string } = {};
      
      if (name && typeof name === 'string') {
        updates.name = name.trim();
      }

      if (Object.keys(updates).length === 0) {
        res.status(400).json({ error: 'No valid updates provided' });
        return;
      }

      const updatedAsset = await UserAssetService.updateUserAsset(assetId, userId, updates);

      Logger.info(`📝 User asset updated: ${assetId} by user ${userId}`);

      res.json({
        success: true,
        data: updatedAsset
      });
    } catch (error) {
      Logger.error('Failed to update user asset:', error);
      res.status(500).json({
        error: 'Failed to update asset',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Delete user asset
   */
  static async deleteUserAsset(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const { assetId } = req.params;
      if (!assetId) {
        res.status(400).json({ error: 'Asset ID is required' });
        return;
      }

      await UserAssetService.deleteUserAsset(assetId, userId);

      Logger.info(`🗑️  User asset deleted: ${assetId} by user ${userId}`);

      res.json({
        success: true,
        message: 'Asset deleted successfully'
      });
    } catch (error) {
      Logger.error('Failed to delete user asset:', error);
      res.status(500).json({
        error: 'Failed to delete asset',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get user asset statistics
   */
  static async getAssetStats(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const stats = await UserAssetService.getAssetStats(userId);

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      Logger.error('Failed to get asset stats:', error);
      res.status(500).json({
        error: 'Failed to retrieve asset statistics',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Proxy asset image to avoid CORS issues
   * Public endpoint - no authentication required
   */
  static async proxyAssetImage(req: Request, res: Response): Promise<void> {
    try {
      // Set CORS headers first for all requests
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      
      // Handle OPTIONS request
      if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
      }

      const { assetId } = req.params;

      if (!assetId) {
        res.status(400).json({
          error: 'Asset ID is required'
        });
        return;
      }

      // Get asset without user verification (public proxy)
      const asset = await UserAssetService.getAssetById(assetId);
      if (!asset) {
        res.status(404).json({
          error: 'Asset not found'
        });
        return;
      }

      // Fetch the image from Supabase storage
      const response = await fetch(asset.url);
      if (!response.ok) {
        throw new Error('Failed to fetch image from storage');
      }
      
      // Set content type and cache headers
      res.setHeader('Content-Type', asset.mimeType);
      res.setHeader('Cache-Control', 'public, max-age=3600'); // 1 hour cache

      // Pipe the image response
      const imageBuffer = await response.arrayBuffer();
      res.send(Buffer.from(imageBuffer));
    } catch (error) {
      Logger.error('Failed to proxy asset image:', error);
      res.status(500).json({
        error: 'Failed to proxy image',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}
