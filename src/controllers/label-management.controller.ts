import { Response, NextFunction } from 'express';
import { prisma } from '../services/database.service';
import { createError } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { generateUniqueLabel, generateCopyName, type LabelForNaming } from '../utils/labelNaming';
import { StorageManager } from '../core/storage/bucket-manager';
import { CacheManager } from '../core/cache/cache-manager';
import { Logger } from '../utils/logger';
import Joi from 'joi';

// Validation schemas for label management
const createLabelWithAutoNamingSchema = Joi.object({
  name: Joi.string().min(1).max(100).optional().messages({
    'string.min': 'Label name must be at least 1 character long',
    'string.max': 'Label name cannot exceed 100 characters'
  }),
  description: Joi.string().max(500).allow('').optional().messages({
    'string.max': 'Description cannot exceed 500 characters'
  }),
  width: Joi.number().positive().max(1000).optional().default(100).messages({
    'number.positive': 'Width must be a positive number',
    'number.max': 'Width cannot exceed 1000mm'
  }),
  height: Joi.number().positive().max(1000).optional().default(50).messages({
    'number.positive': 'Height must be a positive number',
    'number.max': 'Height cannot exceed 1000mm'
  }),
  fabricData: Joi.object().optional(),
  thumbnail: Joi.string().optional()
});

const createFromTemplateSchema = Joi.object({
  name: Joi.string().min(1).max(100).optional().messages({
    'string.min': 'Template name must be at least 1 character long',
    'string.max': 'Template name cannot exceed 100 characters'
  }),
  baseName: Joi.string().min(1).max(100).optional().messages({
    'string.min': 'Base name must be at least 1 character long',
    'string.max': 'Base name cannot exceed 100 characters'
  }),
  width: Joi.number().positive().max(1000).required().messages({
    'number.positive': 'Width must be a positive number',
    'number.max': 'Width cannot exceed 1000mm',
    'any.required': 'Width is required'
  }),
  height: Joi.number().positive().max(1000).required().messages({
    'number.positive': 'Height must be a positive number',
    'number.max': 'Height cannot exceed 1000mm',
    'any.required': 'Height is required'
  }),
  fabricData: Joi.object().optional()
});

const createBulkLabelsSchema = Joi.object({
  count: Joi.number().integer().min(1).max(50).required().messages({
    'number.base': 'Count must be a number',
    'number.integer': 'Count must be an integer',
    'number.min': 'Count must be at least 1',
    'number.max': 'Count cannot exceed 50',
    'any.required': 'Count is required'
  }),
  name: Joi.string().min(1).max(100).optional().messages({
    'string.min': 'Label name must be at least 1 character long',
    'string.max': 'Label name cannot exceed 100 characters'
  }),
  description: Joi.string().max(500).allow('').optional().messages({
    'string.max': 'Description cannot exceed 500 characters'
  }),
  width: Joi.number().positive().max(1000).optional().default(100).messages({
    'number.positive': 'Width must be a positive number',
    'number.max': 'Width cannot exceed 1000mm'
  }),
  height: Joi.number().positive().max(1000).optional().default(50).messages({
    'number.positive': 'Height must be a positive number',
    'number.max': 'Height cannot exceed 1000mm'
  }),
  fabricData: Joi.object().optional()
});

/**
 * Create a new label with automatic unique naming
 * If no name is provided, generates "New Label X" where X is the next available number
 */
export const createLabelWithAutoNaming = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { projectId } = req.params as { projectId: string };
    const userId = req.user?.id;

    if (!userId) {
      return next(createError('Unauthorized', 401));
    }

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: userId,
      },
    });

    if (!project) {
      return next(createError('Project not found', 404));
    }

    // Get existing labels for naming reference
    const existingLabels = await prisma.label.findMany({
      where: { projectId },
      select: {
        id: true,
        name: true,
        projectId: true,
        createdAt: true,
      },
    });

    // Generate unique name
    const labelName = generateUniqueLabel(existingLabels);

    // Create the label
    const label = await prisma.label.create({
      data: {
        name: labelName,
        projectId,
        description: '',
        width: 100,
        height: 50,
      },
    });

    // Clear cache
    await CacheManager.deletePattern(`labels:project:${projectId}:*`);
    await CacheManager.deletePattern(`project:${projectId}:*`);

    res.status(201).json({
      success: true,
      data: label,
    });
  } catch (error) {
    Logger.error('Error creating label with auto naming:', error);
    next(createError('Failed to create label', 500));
  }
};

/**
 * Duplicate an existing label with automatic naming (e.g., "Original Label (Copy)")
 */
export const duplicateLabel = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { labelId } = req.params as { labelId: string };
    const userId = req.user?.id;

    if (!userId) {
      return next(createError('Unauthorized', 401));
    }

    // Get the original label and verify ownership
    const originalLabel = await prisma.label.findFirst({
      where: {
        id: labelId,
        project: {
          userId: userId,
        },
      },
      include: {
        project: true,
      },
    });

    if (!originalLabel) {
      return next(createError('Label not found', 404));
    }

    // Get existing labels for copy naming
    const existingLabels = await prisma.label.findMany({
      where: { projectId: originalLabel.projectId },
      select: {
        id: true,
        name: true,
      },
    });

    // Generate copy name
    const copyName = generateCopyName(originalLabel.name, existingLabels);

    // Create the duplicate
    const duplicateData = {
      name: copyName,
      description: originalLabel.description || '',
      projectId: originalLabel.projectId,
      fabricData: originalLabel.fabricData as any,
      width: originalLabel.width,
      height: originalLabel.height,
    };

    const duplicate = await prisma.label.create({
      data: duplicateData,
    });

    // Clear cache
    await CacheManager.deletePattern(`labels:project:${originalLabel.projectId}:*`);

    res.status(201).json({
      success: true,
      data: duplicate,
    });
  } catch (error) {
    Logger.error('Error duplicating label:', error);
    next(createError('Failed to duplicate label', 500));
  }
};

/**
 * Create a label from a template with smart naming
 */
export const createLabelFromTemplate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { projectId } = req.params as { projectId: string };
    const { templateId, name: customName } = req.body as { templateId: string; name?: string };
    const userId = req.user?.id;

    if (!userId) {
      return next(createError('Unauthorized', 401));
    }

    if (!templateId) {
      return next(createError('Template ID is required', 400));
    }

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: userId,
      },
    });

    if (!project) {
      return next(createError('Project not found', 404));
    }

    // Get template data from templates system
    const templateData = {
      width: 100,
      height: 50,
      fabricData: null,
    };

    // Get existing labels for naming
    const existingLabels = await prisma.label.findMany({
      where: { projectId },
      select: {
        id: true,
        name: true,
      },
    });

    // Generate name - use custom name or template-based name
    const labelName = customName || generateUniqueLabel(existingLabels, 'Template Label');

    // Create label from template
    const label = await prisma.label.create({
      data: {
        name: labelName,
        description: `Created from template ${templateId}`,
        projectId,
        width: templateData.width,
        height: templateData.height,
        fabricData: templateData.fabricData as any,
      },
    });

    // Clear cache
    await CacheManager.deletePattern(`labels:project:${projectId}:*`);

    res.status(201).json({
      success: true,
      data: label,
    });
  } catch (error) {
    Logger.error('Error creating label from template:', error);
    next(createError('Failed to create label from template', 500));
  }
};

/**
 * Create multiple labels at once with automatic numbering
 */
export const createBulkLabels = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { projectId } = req.params;
    const userId = req.user!.id;

    if (!projectId) {
      throw createError('Project ID is required', 400);
    }

    const { error, value } = createBulkLabelsSchema.validate(req.body);
    if (error) {
      throw createError(error.details[0]?.message || 'Validation error', 400);
    }

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: { id: projectId, userId }
    });

    if (!project) {
      throw createError('Project not found', 404);
    }

    const { count, name, description, width, height, fabricData } = value;

    // Get existing labels for name generation
    const existingLabels = await prisma.label.findMany({
      where: { projectId },
      select: { id: true, name: true }
    });

    const baseName = name || 'New Label';
    const labels = [];

    // Create labels one by one to ensure proper numbering
    for (let i = 0; i < count; i++) {
      // Refresh existing labels list for each iteration to account for newly created labels
      const currentExistingLabels = await prisma.label.findMany({
        where: { projectId },
        select: { id: true, name: true }
      });

      const labelName = generateUniqueLabel(currentExistingLabels as LabelForNaming[], baseName);

      const label = await prisma.label.create({
        data: {
          name: labelName,
          description: description || `Bulk created label ${i + 1}`,
          width,
          height,
          projectId,
          fabricData: fabricData || {
            version: '6.0.0',
            objects: [],
            background: '#ffffff'
          }
        }
      });

      labels.push(label);
    }

    // Clear cache
    await CacheManager.deletePattern(`projects:${userId}:*`);
    await CacheManager.delete(`project:${projectId}`);

    Logger.info(`🔢 Bulk created ${count} labels in project ${projectId}`);

    res.status(201).json({
      success: true,
      message: `${count} labels created successfully`,
      data: labels
    });
  } catch (error) {
    next(error);
  }
};
