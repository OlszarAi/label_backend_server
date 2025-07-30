import { Router } from 'express';
import { 
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  getProjectLabels,
  getLabel,
  createLabel,
  updateLabel,
  deleteLabel,
  refreshThumbnailUrl,
  exportProjectLabels,
  exportLabel
} from '../controllers/project.controller';
import { validateAuth } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(validateAuth);

// Project routes
router.get('/', getProjects);
router.post('/', createProject);
router.get('/:id', getProject);
router.put('/:id', updateProject);
router.delete('/:id', deleteProject);

// Label routes within projects
router.get('/:projectId/labels', getProjectLabels);
router.post('/:projectId/labels', createLabel);
router.get('/labels/:labelId', getLabel);
router.put('/labels/:labelId', updateLabel);
router.delete('/labels/:labelId', deleteLabel);

// Thumbnail management
router.post('/labels/:labelId/refresh-thumbnail', refreshThumbnailUrl);

// Export routes
router.get('/:projectId/labels/export', exportProjectLabels);
router.get('/labels/:labelId/export', exportLabel);

export { router as projectRoutes };
