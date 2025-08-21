import { Response, NextFunction } from 'express';
import { prisma } from '../services/database.service';
import { createError } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { StorageManager } from '../core/storage/bucket-manager';
import { CacheManager } from '../core/cache/cache-manager';
import { Logger } from '../utils/logger';
import Joi from 'joi';

// Validation schemas
const createTemplateSchema = Joi.object({
  name: Joi.string().min(1).max(100).required().messages({
    'string.min': 'Template name must be at least 1 character long',
    'string.max': 'Template name cannot exceed 100 characters',
    'any.required': 'Template name is required'
  }),
  description: Joi.string().max(500).allow('').optional().messages({
    'string.max': 'Description cannot exceed 500 characters'
  }),
  category: Joi.string().valid('STANDARD', 'ADDRESS', 'SHIPPING', 'PRODUCT', 'INDUSTRIAL', 'CUSTOM', 'MARKETING', 'OFFICE').default('CUSTOM'),
  tags: Joi.array().items(Joi.string().max(50)).max(10).default([]),
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
  fabricData: Joi.object().required().messages({
    'any.required': 'Fabric data is required'
  }),
  thumbnail: Joi.string().optional(),
  isPublic: Joi.boolean().default(false),
  isDefault: Joi.boolean().default(false)
});

const updateTemplateSchema = Joi.object({
  name: Joi.string().min(1).max(100).optional(),
  description: Joi.string().max(500).allow('').optional(),
  category: Joi.string().valid('STANDARD', 'ADDRESS', 'SHIPPING', 'PRODUCT', 'INDUSTRIAL', 'CUSTOM', 'MARKETING', 'OFFICE').optional(),
  tags: Joi.array().items(Joi.string().max(50)).max(10).optional(),
  isPublic: Joi.boolean().optional(),
  isDefault: Joi.boolean().optional(),
  thumbnail: Joi.string().optional(),
  fabricData: Joi.object().optional()
});

/**
 * Get all templates (public + user's private ones)
 */
export const getTemplates = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { category, isPublic, search, limit = '50', offset = '0' } = req.query;

    const cacheKey = `templates:${userId}:${category || 'all'}:${isPublic || 'all'}:${search || ''}:${limit}:${offset}`;
    const cached = await CacheManager.get(cacheKey);
    if (cached) {
      return res.json({
        success: true,
        data: cached.templates,
        total: cached.total,
        cached: true
      });
    }

    const where: any = {
      OR: [
        { isPublic: true },
        { userId: userId },
        { isSystem: true }
      ]
    };

    if (category && category !== 'all') {
      where.category = category;
    }

    if (isPublic === 'true') {
      where.isPublic = true;
    }

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
        { tags: { has: search as string } }
      ];
    }

    const [templates, total] = await Promise.all([
      prisma.template.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true
            }
          },
          _count: {
            select: {
              labels: true
            }
          }
        },
        orderBy: [
          { isSystem: 'desc' },
          { isDefault: 'desc' },
          { downloads: 'desc' },
          { createdAt: 'desc' }
        ],
        take: parseInt(limit as string),
        skip: parseInt(offset as string)
      }),
      prisma.template.count({ where })
    ]);

    // Cache for 5 minutes
    await CacheManager.set(cacheKey, { templates, total });

    Logger.info(`📋 Retrieved ${templates.length} templates for user ${userId}`);

    res.json({
      success: true,
      data: templates,
      total,
      cached: false
    });
  } catch (error) {
    Logger.error('Error retrieving templates:', error);
    return next(error);
  }
};

/**
 * Get single template by ID
 */
export const getTemplate = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { templateId } = req.params;
    const userId = req.user!.id;

    if (!templateId) {
      throw createError('Template ID is required', 400);
    }

    const template = await prisma.template.findFirst({
      where: {
        id: templateId,
        OR: [
          { isPublic: true },
          { userId: userId },
          { isSystem: true }
        ]
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true
          }
        },
        _count: {
          select: {
            labels: true
          }
        }
      }
    });

    if (!template) {
      throw createError('Template not found or access denied', 404);
    }

    // Increment downloads if not owner
    if (template.userId !== userId) {
      await prisma.template.update({
        where: { id: templateId },
        data: { downloads: { increment: 1 } }
      });
    }

    Logger.info(`📋 Template ${templateId} accessed by user ${userId}`);

    res.json({
      success: true,
      data: template
    });
  } catch (error) {
    Logger.error('Error retrieving template:', error);
    next(error);
  }
};

/**
 * Create new template
 */
export const createTemplate = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;

    const { error, value } = createTemplateSchema.validate(req.body);
    if (error) {
      throw createError(error.details[0]?.message || 'Validation error', 400);
    }

    const { name, description, category, tags, width, height, fabricData, thumbnail, isPublic, isDefault } = value;

    // Handle thumbnail upload if provided
    let thumbnailUrl = thumbnail;
    if (thumbnail && thumbnail.startsWith('data:image/')) {
      try {
        const uploadResult = await StorageManager.uploadThumbnail({
          labelId: `template-${Date.now()}`,
          dataURL: thumbnail
        });
        thumbnailUrl = uploadResult.url;
      } catch (uploadError) {
        Logger.error('Failed to upload template thumbnail:', uploadError);
        // Continue without thumbnail
        thumbnailUrl = null;
      }
    }

    const template = await prisma.template.create({
      data: {
        name,
        description,
        category,
        tags,
        width,
        height,
        fabricData,
        thumbnail: thumbnailUrl,
        isPublic,
        isDefault,
        userId
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    // Clear templates cache
    await CacheManager.deletePattern(`templates:*`);

    Logger.info(`📋 Template created: ${template.id} by user ${userId}`);

    res.status(201).json({
      success: true,
      message: 'Template created successfully',
      data: template
    });
  } catch (error) {
    Logger.error('Error creating template:', error);
    next(error);
  }
};

/**
 * Update template
 */
export const updateTemplate = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { templateId } = req.params;
    const userId = req.user!.id;

    if (!templateId) {
      throw createError('Template ID is required', 400);
    }

    const { error, value } = updateTemplateSchema.validate(req.body);
    if (error) {
      throw createError(error.details[0]?.message || 'Validation error', 400);
    }

    // Check ownership
    const existingTemplate = await prisma.template.findFirst({
      where: { id: templateId, userId }
    });

    if (!existingTemplate) {
      throw createError('Template not found or access denied', 404);
    }

    const { thumbnail, ...updateData } = value;

    // Handle thumbnail upload if provided
    let thumbnailUrl = existingTemplate.thumbnail;
    if (thumbnail && thumbnail.startsWith('data:image/')) {
      try {
        const uploadResult = await StorageManager.uploadThumbnail({
          labelId: templateId,
          dataURL: thumbnail
        });
        thumbnailUrl = uploadResult.url;
      } catch (uploadError) {
        Logger.error('Failed to upload template thumbnail:', uploadError);
      }
    }

    const template = await prisma.template.update({
      where: { id: templateId },
      data: {
        ...updateData,
        thumbnail: thumbnailUrl,
        updatedAt: new Date()
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    // Clear templates cache
    await CacheManager.deletePattern(`templates:*`);

    Logger.info(`📋 Template updated: ${templateId} by user ${userId}`);

    res.json({
      success: true,
      message: 'Template updated successfully',
      data: template
    });
  } catch (error) {
    Logger.error('Error updating template:', error);
    next(error);
  }
};

/**
 * Delete template
 */
export const deleteTemplate = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { templateId } = req.params;
    const userId = req.user!.id;

    if (!templateId) {
      throw createError('Template ID is required', 400);
    }

    // Check ownership (admins can delete any template)
    const template = await prisma.template.findFirst({
      where: { 
        id: templateId,
        OR: [
          { userId },
          ...(req.user!.role === 'ADMIN' || req.user!.role === 'SUPER_ADMIN' ? [{}] : [])
        ]
      }
    });

    if (!template) {
      throw createError('Template not found or access denied', 404);
    }

    // Don't allow deletion of system templates
    if (template.isSystem) {
      throw createError('Cannot delete system templates', 403);
    }

    await prisma.template.delete({
      where: { id: templateId }
    });

    // Clear templates cache
    await CacheManager.deletePattern(`templates:*`);

    Logger.info(`📋 Template deleted: ${templateId} by user ${userId}`);

    res.json({
      success: true,
      message: 'Template deleted successfully'
    });
  } catch (error) {
    Logger.error('Error deleting template:', error);
    next(error);
  }
};

/**
 * Duplicate template
 */
export const duplicateTemplate = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { templateId } = req.params;
    const userId = req.user!.id;

    if (!templateId) {
      throw createError('Template ID is required', 400);
    }

    const originalTemplate = await prisma.template.findFirst({
      where: {
        id: templateId,
        OR: [
          { isPublic: true },
          { userId: userId },
          { isSystem: true }
        ]
      }
    });

    if (!originalTemplate) {
      throw createError('Template not found or access denied', 404);
    }

    const duplicatedTemplate = await prisma.template.create({
      data: {
        name: `${originalTemplate.name} (Copy)`,
        description: originalTemplate.description,
        category: originalTemplate.category,
        tags: originalTemplate.tags,
        width: originalTemplate.width,
        height: originalTemplate.height,
        fabricData: originalTemplate.fabricData as any,
        thumbnail: originalTemplate.thumbnail,
        isPublic: false, // Always private when duplicated
        isDefault: false,
        isSystem: false,
        userId
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    // Clear templates cache
    await CacheManager.deletePattern(`templates:*`);

    Logger.info(`📋 Template duplicated: ${templateId} -> ${duplicatedTemplate.id} by user ${userId}`);

    res.status(201).json({
      success: true,
      message: 'Template duplicated successfully',
      data: duplicatedTemplate
    });
  } catch (error) {
    Logger.error('Error duplicating template:', error);
    next(error);
  }
};

/**
 * Get template categories
 */
export const getTemplateCategories = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const categories = await prisma.template.groupBy({
      by: ['category'],
      _count: {
        category: true
      },
      where: {
        OR: [
          { isPublic: true },
          { userId: req.user!.id },
          { isSystem: true }
        ]
      }
    });

    res.json({
      success: true,
      data: categories.map(cat => ({
        category: cat.category,
        count: cat._count.category
      }))
    });
  } catch (error) {
    Logger.error('Error retrieving template categories:', error);
    next(error);
  }
};
