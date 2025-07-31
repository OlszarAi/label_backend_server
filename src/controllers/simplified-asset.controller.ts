/**
 * Simplified Asset Controller
 * Unified controller for all asset operations with better CORS handling
 */

import { Request, Response } from 'express';
import multer from 'multer';
import { UnifiedAssetService } from '../services/unified-asset.service';
import { Logger } from '../utils/logger';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { prisma } from '../services/database.service';

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit (increased for better quality)
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

// Initialize service
const assetService = new UnifiedAssetService(prisma);

export class SimplifiedAssetController {
  /**
   * Upload new asset with optimization
   */
  static uploadAsset = [
    upload.single('file'),
    async (req: AuthenticatedRequest, res: Response): Promise<void> => {
      try {
        const userId = req.user?.id;
        if (!userId) {
          res.status(401).json({ 
            success: false, 
            error: 'Authentication required' 
          });
          return;
        }

        if (!req.file) {
          res.status(400).json({ 
            success: false, 
            error: 'No file provided' 
          });
          return;
        }

        const { name } = req.body;
        if (!name || typeof name !== 'string') {
          res.status(400).json({ 
            success: false, 
            error: 'Asset name is required' 
          });
          return;
        }

        // Upload and process asset
        const asset = await assetService.uploadAsset({
          userId,
          file: req.file.buffer,
          fileName: req.file.originalname,
          name: name.trim(),
          mimeType: req.file.mimetype,
        });

        Logger.info(`✅ Asset uploaded: ${asset.name} (${asset.id})`);

        res.status(201).json({
          success: true,
          data: asset,
          message: 'Asset uploaded successfully',
        });

      } catch (error) {
        Logger.error('Asset upload error:', error);
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to upload asset',
        });
      }
    }
  ];

  /**
   * Get all user assets
   */
  static async getUserAssets(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ 
          success: false, 
          error: 'Authentication required' 
        });
        return;
      }

      const assets = await assetService.getUserAssets(userId);

      res.json({
        success: true,
        data: assets,
      });

    } catch (error) {
      Logger.error('Get user assets error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve assets',
      });
    }
  }

  /**
   * Get single asset
   */
  static async getAsset(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { assetId } = req.params;

      if (!userId) {
        res.status(401).json({ 
          success: false, 
          error: 'Authentication required' 
        });
        return;
      }

      if (!assetId) {
        res.status(400).json({ 
          success: false, 
          error: 'Asset ID is required' 
        });
        return;
      }

      const asset = await assetService.getAssetById(assetId);

      if (!asset) {
        res.status(404).json({ 
          success: false, 
          error: 'Asset not found' 
        });
        return;
      }

      res.json({
        success: true,
        data: asset,
      });

    } catch (error) {
      Logger.error('Get asset error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve asset',
      });
    }
  }

  /**
   * Update asset
   */
  static async updateAsset(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { assetId } = req.params;
      const { name } = req.body;

      if (!userId) {
        res.status(401).json({ 
          success: false, 
          error: 'Authentication required' 
        });
        return;
      }

      if (!assetId) {
        res.status(400).json({ 
          success: false, 
          error: 'Asset ID is required' 
        });
        return;
      }

      const updates: { name?: string } = {};
      if (name && typeof name === 'string') {
        updates.name = name.trim();
      }

      const asset = await assetService.updateAsset(assetId, userId, updates);

      res.json({
        success: true,
        data: asset,
        message: 'Asset updated successfully',
      });

    } catch (error) {
      Logger.error('Update asset error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update asset',
      });
    }
  }

  /**
   * Delete asset
   */
  static async deleteAsset(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { assetId } = req.params;

      if (!userId) {
        res.status(401).json({ 
          success: false, 
          error: 'Authentication required' 
        });
        return;
      }

      if (!assetId) {
        res.status(400).json({ 
          success: false, 
          error: 'Asset ID is required' 
        });
        return;
      }

      await assetService.deleteAsset(assetId, userId);

      res.json({
        success: true,
        message: 'Asset deleted successfully',
      });

    } catch (error) {
      Logger.error('Delete asset error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete asset',
      });
    }
  }

  /**
   * Get asset statistics
   */
  static async getAssetStats(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ 
          success: false, 
          error: 'Authentication required' 
        });
        return;
      }

      const stats = await assetService.getAssetStats(userId);

      res.json({
        success: true,
        data: stats,
      });

    } catch (error) {
      Logger.error('Get asset stats error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve asset statistics',
      });
    }
  }

  /**
   * Proxy asset for CORS-free access (PUBLIC ENDPOINT)
   */
  static async proxyAsset(req: Request, res: Response): Promise<void> {
    try {
      const { assetId } = req.params;

      if (!assetId) {
        res.status(400).json({
          success: false,
          error: 'Asset ID is required'
        });
        return;
      }

      // Get asset (this returns signed URL for direct access)
      const asset = await assetService.getAssetById(assetId);
      if (!asset) {
        res.status(404).json({
          success: false,
          error: 'Asset not found'
        });
        return;
      }

      // Fetch the actual file from Supabase
      const imageResponse = await fetch(asset.url);
      if (!imageResponse.ok) {
        throw new Error('Failed to fetch asset from storage');
      }

      // Set proper headers for image response
      res.setHeader('Content-Type', asset.mimeType);
      res.setHeader('Cache-Control', 'public, max-age=86400'); // 24 hour cache
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');

      // Stream the image
      const imageBuffer = await imageResponse.arrayBuffer();
      res.send(Buffer.from(imageBuffer));

    } catch (error) {
      Logger.error('Proxy asset error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to proxy asset',
      });
    }
  }
}
