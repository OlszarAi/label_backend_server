/**
 * Simplified Asset Routes
 * Clean, unified routing for asset management with proper CORS
 */

import { Router } from 'express';
import { SimplifiedAssetController } from '../controllers/simplified-asset.controller';
import { validateAuth } from '../middleware/auth.middleware';

const router = Router();

/**
 * CORS Middleware for all asset routes
 * This ensures consistent CORS handling across all endpoints
 */
router.use((req, res, next) => {
  // Set CORS headers for all asset requests
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, Origin, X-Requested-With');
  res.header('Access-Control-Expose-Headers', 'Content-Type, Content-Length, Cache-Control');
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  
  // Handle preflight OPTIONS requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  next();
});

// ============================================================================
// PUBLIC ROUTES (No authentication required)
// ============================================================================

/**
 * GET /assets/:assetId/proxy
 * Public proxy endpoint for CORS-free image access
 * This is the main endpoint used by frontend to display images
 */
router.get('/:assetId/proxy', SimplifiedAssetController.proxyAsset);

// ============================================================================
// PROTECTED ROUTES (Authentication required)
// ============================================================================

// Apply authentication middleware to all routes below
router.use(validateAuth);

/**
 * POST /assets/upload
 * Upload new asset with automatic optimization
 * Supports: images up to 10MB, automatic resizing, WebP conversion
 */
router.post('/upload', SimplifiedAssetController.uploadAsset);

/**
 * GET /assets
 * Get all user assets with pagination and filtering
 */
router.get('/', SimplifiedAssetController.getUserAssets);

/**
 * GET /assets/stats
 * Get user asset statistics (count, total size, breakdown by type)
 */
router.get('/stats', SimplifiedAssetController.getAssetStats);

/**
 * GET /assets/:assetId
 * Get single asset details (authenticated access)
 */
router.get('/:assetId', SimplifiedAssetController.getAsset);

/**
 * PUT /assets/:assetId
 * Update asset metadata (name, etc.)
 */
router.put('/:assetId', SimplifiedAssetController.updateAsset);

/**
 * DELETE /assets/:assetId
 * Delete asset (soft delete)
 */
router.delete('/:assetId', SimplifiedAssetController.deleteAsset);

export default router;
