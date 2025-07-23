/**
 * Dedykowany kontroler do zarządzania etykietami
 * Upraszcza API i centralizuje logikę tworzenia etykiet
 */

import { Request, Response, NextFunction } from 'express';
import { LabelCreationService, CreateLabelRequest } from '../services/label-management/labelCreationService';

interface AuthenticatedRequest extends Request {
  user?: { id: string };
}

/**
 * POST /api/label-management/projects/:projectId/create
 * Tworzy nową etykietę z automatycznym nazewnictwem
 */
export const createNewLabel = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { projectId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    if (!projectId) {
      res.status(400).json({
        success: false,
        message: 'Project ID is required'
      });
      return;
    }

    const labelData: CreateLabelRequest = req.body || {};

    const label = await LabelCreationService.createLabel(projectId, userId, labelData);

    res.status(201).json({
      success: true,
      message: 'Label created successfully',
      data: label
    });
  } catch (error) {
    console.error('Error creating label:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to create label'
    });
  }
};

/**
 * POST /api/label-management/labels/:labelId/duplicate
 * Duplikuje istniejącą etykietę
 */
export const duplicateExistingLabel = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { labelId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    if (!labelId) {
      res.status(400).json({
        success: false,
        message: 'Label ID is required'
      });
      return;
    }

    const duplicatedLabel = await LabelCreationService.duplicateLabel(labelId, userId);

    res.status(201).json({
      success: true,
      message: 'Label duplicated successfully',
      data: duplicatedLabel
    });
  } catch (error) {
    console.error('Error duplicating label:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to duplicate label'
    });
  }
};

/**
 * POST /api/label-management/projects/:projectId/create-from-template
 * Tworzy etykietę z szablonu
 */
export const createFromTemplate = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { projectId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    if (!projectId) {
      res.status(400).json({
        success: false,
        message: 'Project ID is required'
      });
      return;
    }

    const templateData = req.body;

    if (!templateData.width || !templateData.height) {
      res.status(400).json({
        success: false,
        message: 'Template width and height are required'
      });
      return;
    }

    const label = await LabelCreationService.createFromTemplate(projectId, userId, templateData);

    res.status(201).json({
      success: true,
      message: 'Label created from template successfully',
      data: label
    });
  } catch (error) {
    console.error('Error creating label from template:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to create label from template'
    });
  }
};

/**
 * POST /api/label-management/projects/:projectId/bulk-create
 * Tworzy wiele etykiet naraz
 */
export const createBulkLabels = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { projectId } = req.params;
    const userId = req.user?.id;
    const { count, ...baseData } = req.body;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    if (!projectId) {
      res.status(400).json({
        success: false,
        message: 'Project ID is required'
      });
      return;
    }

    if (!count || count < 1 || count > 50) {
      res.status(400).json({
        success: false,
        message: 'Count must be between 1 and 50'
      });
      return;
    }

    const labels = await LabelCreationService.createBulkLabels(projectId, userId, count, baseData);

    res.status(201).json({
      success: true,
      message: `${labels.length} labels created successfully`,
      data: labels
    });
  } catch (error) {
    console.error('Error creating bulk labels:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to create bulk labels'
    });
  }
};
