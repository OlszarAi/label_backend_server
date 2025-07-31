import { Router } from 'express';
import { 
  createLabelWithAutoNaming,
  duplicateLabel,
  createLabelFromTemplate,
  createBulkLabels
} from '../controllers/label-management.controller';
import { validateAuth } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(validateAuth);

// Advanced label management routes
router.post('/projects/:projectId/create', createLabelWithAutoNaming);
router.post('/labels/:labelId/duplicate', duplicateLabel);
router.post('/projects/:projectId/create-from-template', createLabelFromTemplate);
router.post('/projects/:projectId/bulk-create', createBulkLabels);

export { router as labelManagementRoutes };
