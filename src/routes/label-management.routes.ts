import { Router } from 'express';
import { 
  createLabelWithAutoNaming,
  duplicateLabel,
  createLabelFromTemplate,
  createBulkLabels,
  createBulkLabelsUnique,
  saveAsTemplate
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
router.post('/projects/:projectId/bulk-create-unique', createBulkLabelsUnique);
router.post('/labels/:labelId/save-as-template', saveAsTemplate);

export { router as labelManagementRoutes };
