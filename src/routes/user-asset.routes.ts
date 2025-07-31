/**
 * User Asset Routes
 * Handles user-uploaded graphics/logos endpoints
 */

import { Router } from 'express';
import { UserAssetController } from '../controllers/user-asset.controller';
import { validateAuth } from '../middleware/auth.middleware';

const router = Router();

// Global CORS middleware for all asset routes
router.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, Origin, X-Requested-With');
  res.header('Access-Control-Expose-Headers', 'Content-Type, Content-Length, Cache-Control');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  next();
});

// Public routes (no authentication required)
router.get('/:assetId/proxy', UserAssetController.proxyAssetImage); // Public for CORS

// All other routes require authentication
router.use(validateAuth);

// Asset management routes
router.post('/upload', UserAssetController.uploadAsset);
router.get('/', UserAssetController.getUserAssets);
router.get('/stats', UserAssetController.getAssetStats);
router.get('/:assetId', UserAssetController.getUserAsset);
router.put('/:assetId', UserAssetController.updateUserAsset);
router.delete('/:assetId', UserAssetController.deleteUserAsset);

export default router;
