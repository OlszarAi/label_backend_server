/**
 * Dedykowane routes dla zarządzania etykietami
 */

import { Router } from 'express';
import { validateAuth } from '../middleware/auth.middleware';
import {
  createNewLabel,
  duplicateExistingLabel,
  createFromTemplate,
  createBulkLabels
} from '../controllers/labelManagement.controller';

const router = Router();

// Wszystkie routes wymagają autoryzacji
router.use(validateAuth);

// Tworzenie nowej etykiety
router.post('/projects/:projectId/create', createNewLabel);

// Duplikowanie etykiety
router.post('/labels/:labelId/duplicate', duplicateExistingLabel);

// Tworzenie z szablonu
router.post('/projects/:projectId/create-from-template', createFromTemplate);

// Tworzenie wielu etykiet
router.post('/projects/:projectId/bulk-create', createBulkLabels);

export default router;
