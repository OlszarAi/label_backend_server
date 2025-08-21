import { Router } from 'express';
import { 
  getTemplates,
  getTemplate,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  duplicateTemplate,
  getTemplateCategories
} from '../controllers/template.controller';
import { validateAuth } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(validateAuth);

// Template routes
router.get('/', getTemplates);
router.get('/categories', getTemplateCategories);
router.get('/:templateId', getTemplate);
router.post('/', createTemplate);
router.put('/:templateId', updateTemplate);
router.delete('/:templateId', deleteTemplate);
router.post('/:templateId/duplicate', duplicateTemplate);

export { router as templateRoutes };
