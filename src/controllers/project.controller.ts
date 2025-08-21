import { Request, Response, NextFunction } from 'express';
import { prisma } from '../services/database.service';
import { createError } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { createProjectSchema, updateProjectSchema, createLabelSchema, updateLabelSchema } from '../validation/project.validation';
import { generateCopyName, type LabelForNaming } from '../utils/labelNaming';
import { CacheManager } from '../core/cache/cache-manager';
import { StorageManager } from '../core/storage/bucket-manager';
import { ThumbnailService } from '../services/thumbnail.service';
import { Logger } from '../utils/logger';

export const getProjects = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { page = 1, limit = 10, search } = req.query;
    
    // Try cache first
    const cacheKey = `projects:${userId}:${page}:${limit}:${search || 'all'}`;
    const cached = await CacheManager.get(cacheKey);
    
    if (cached) {
      res.status(200).json({
        success: true,
        data: cached,
        cached: true
      });
      return;
    }
    
    const offset = (Number(page) - 1) * Number(limit);
    
    const whereClause: any = { userId };
    if (search) {
      whereClause.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    const [projects, totalCount] = await Promise.all([
      prisma.project.findMany({
        where: whereClause,
        include: {
          labels: {
            select: {
              id: true,
              name: true,
              createdAt: true,
              updatedAt: true
            }
          },
          _count: {
            select: { labels: true }
          }
        },
        orderBy: { updatedAt: 'desc' },
        skip: offset,
        take: Number(limit)
      }),
      prisma.project.count({ where: whereClause })
    ]);

    const result = {
      projects,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: totalCount,
        totalPages: Math.ceil(totalCount / Number(limit))
      }
    };

    // Cache result
    await CacheManager.set(cacheKey, result, 'PROJECT');

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

export const getProject = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    if (!id) {
      throw createError('Project ID is required', 400);
    }

    const project = await prisma.project.findFirst({
      where: { id, userId },
      include: {
        labels: {
          orderBy: { updatedAt: 'desc' }
        },
        _count: {
          select: { labels: true }
        }
      }
    });

    if (!project) {
      throw createError('Project not found', 404);
    }

    // Refresh signed URLs for thumbnails in all labels
    if (project.labels && project.labels.length > 0) {
      const labelsWithFreshUrls = await Promise.all(
        project.labels.map(async (label) => {
          if (label.thumbnail) {
            const freshThumbnailUrl = await ThumbnailService.getThumbnailUrl(label.id, 'md');
            return {
              ...label,
              thumbnail: freshThumbnailUrl || label.thumbnail
            };
          }
          return label;
        })
      );
      project.labels = labelsWithFreshUrls;
    }

    res.status(200).json({
      success: true,
      data: project
    });
  } catch (error) {
    next(error);
  }
};

export const createProject = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { error, value } = createProjectSchema.validate(req.body);
    if (error) {
      throw createError(error.details[0]?.message || 'Validation error', 400);
    }

    const { name, description, icon, color } = value;
    const userId = req.user!.id;

    const project = await prisma.project.create({
      data: {
        name,
        description,
        icon,
        color: color || '#3b82f6',
        userId
      },
      include: {
        labels: true,
        _count: {
          select: { labels: true }
        }
      }
    });

    // Create default label for new project
    await prisma.label.create({
      data: {
        name: 'Default Label',
        description: 'Default label for new project',
        projectId: project.id,
        fabricData: {
          version: '6.0.0',
          objects: [],
          background: '#ffffff'
        }
      }
    });

    // Fetch updated project with the default label
    const updatedProject = await prisma.project.findUnique({
      where: { id: project.id },
      include: {
        labels: {
          orderBy: { createdAt: 'asc' }
        },
        _count: {
          select: { labels: true }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      data: updatedProject
    });
  } catch (error) {
    next(error);
  }
};

export const updateProject = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    if (!id) {
      throw createError('Project ID is required', 400);
    }

    const { error, value } = updateProjectSchema.validate(req.body);
    if (error) {
      throw createError(error.details[0]?.message || 'Validation error', 400);
    }

    // Check if project exists and belongs to user
    const existingProject = await prisma.project.findFirst({
      where: { id, userId }
    });

    if (!existingProject) {
      throw createError('Project not found', 404);
    }

    const project = await prisma.project.update({
      where: { id },
      data: {
        ...value,
        updatedAt: new Date()
      },
      include: {
        labels: {
          orderBy: { updatedAt: 'desc' }
        },
        _count: {
          select: { labels: true }
        }
      }
    });

    res.status(200).json({
      success: true,
      message: 'Project updated successfully',
      data: project
    });
  } catch (error) {
    next(error);
  }
};

export const deleteProject = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    if (!id) {
      throw createError('Project ID is required', 400);
    }

    // Check if project exists and belongs to user
    const existingProject = await prisma.project.findFirst({
      where: { id, userId }
    });

    if (!existingProject) {
      throw createError('Project not found', 404);
    }

    await prisma.project.delete({
      where: { id }
    });

    res.status(200).json({
      success: true,
      message: 'Project deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Label management within projects
export const getProjectLabels = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { projectId } = req.params;
    const userId = req.user!.id;
    const { sortBy = 'updatedAt', sortOrder = 'desc', search } = req.query;

    if (!projectId) {
      throw createError('Project ID is required', 400);
    }

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: { id: projectId, userId }
    });

    if (!project) {
      throw createError('Project not found', 404);
    }

    const whereClause: any = { projectId };
    if (search) {
      whereClause.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    const labels = await prisma.label.findMany({
      where: whereClause,
      orderBy: { [sortBy as string]: sortOrder }
    });

    // Refresh signed URLs for thumbnails to prevent expired tokens
    const labelsWithFreshUrls = await Promise.all(
      labels.map(async (label) => {
        if (label.thumbnail) {
          // Refresh the signed URL for the thumbnail
          const freshThumbnailUrl = await ThumbnailService.getThumbnailUrl(label.id, 'md');
          return {
            ...label,
            thumbnail: freshThumbnailUrl || label.thumbnail // Use fresh URL or fallback to original
          };
        }
        return label;
      })
    );

    res.status(200).json({
      success: true,
      data: labelsWithFreshUrls
    });
  } catch (error) {
    next(error);
  }
};

export const getLabel = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { labelId } = req.params;
    const userId = req.user!.id;

    if (!labelId) {
      throw createError('Label ID is required', 400);
    }

    const label = await prisma.label.findFirst({
      where: { 
        id: labelId,
        project: { userId }
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            color: true
          }
        }
      }
    });

    if (!label) {
      throw createError('Label not found', 404);
    }

    // Refresh signed URL for thumbnail if it exists
    if (label.thumbnail) {
      const freshThumbnailUrl = await ThumbnailService.getThumbnailUrl(label.id, 'md');
      if (freshThumbnailUrl) {
        label.thumbnail = freshThumbnailUrl;
      }
    }

    res.status(200).json({
      success: true,
      data: label
    });
  } catch (error) {
    next(error);
  }
};

export const createLabel = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { projectId } = req.params;
    const userId = req.user!.id;

    if (!projectId) {
      throw createError('Project ID is required', 400);
    }

    const { error, value } = createLabelSchema.validate(req.body);
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

    // Handle thumbnail upload to Supabase Storage
    let thumbnailData = value.thumbnail;
    
    if (thumbnailData && thumbnailData.startsWith('data:image/')) {
      try {
        // We'll get labelId after creation, so for now store data URL
        // and upload in a separate operation
      } catch (uploadError) {
        Logger.error('Failed to upload thumbnail to storage:', uploadError);
      }
    }

    const label = await prisma.label.create({
      data: {
        ...value,
        projectId,
        thumbnail: thumbnailData,
        fabricData: value.fabricData || {
          version: '6.0.0',
          objects: [],
          background: '#ffffff'
        }
      }
    });

    // Now upload thumbnail with proper labelId if needed
    if (thumbnailData && thumbnailData.startsWith('data:image/')) {
      try {
        const uploadResult = await StorageManager.uploadThumbnail({
          labelId: label.id,
          dataURL: thumbnailData
        });
        
        // Update label with storage URL
        await prisma.label.update({
          where: { id: label.id },
          data: { thumbnail: uploadResult.url }
        });
        
        label.thumbnail = uploadResult.url;
      } catch (uploadError) {
        Logger.error('Failed to upload thumbnail to storage after creation:', uploadError);
        // Continue with data URL
      }
    }

    // Clear cache for projects list
    await CacheManager.deletePattern(`projects:${userId}:*`);
    await CacheManager.delete(`project:${projectId}`);

    res.status(201).json({
      success: true,
      message: 'Label created successfully',
      data: label
    });
  } catch (error) {
    next(error);
  }
};

export const updateLabel = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { labelId } = req.params;
    const userId = req.user!.id;

    if (!labelId) {
      throw createError('Label ID is required', 400);
    }

    const { error, value } = updateLabelSchema.validate(req.body);
    if (error) {
      throw createError(error.details[0]?.message || 'Validation error', 400);
    }

    // Check if label exists and user owns the project
    const existingLabel = await prisma.label.findFirst({
      where: { 
        id: labelId,
        project: { userId }
      }
    });

    if (!existingLabel) {
      throw createError('Label not found', 404);
    }

    // Optimistic locking: check version if provided
    if (value.version && existingLabel.version !== value.version) {
      res.status(409).json({
        success: false,
        message: 'Label has been modified by another session. Please refresh and try again.',
        error: 'VERSION_CONFLICT',
        data: {
          currentVersion: existingLabel.version,
          providedVersion: value.version
        }
      });
      return;
    }

    // Handle thumbnail upload to Supabase Storage
    let thumbnailData = value.thumbnail;
    let thumbnailUrl = existingLabel.thumbnail; // Keep existing as fallback
    
    if (thumbnailData && thumbnailData.startsWith('data:image/')) {
      try {
        // Delete old thumbnails first (cleanup old files)
        if (existingLabel.thumbnail && existingLabel.thumbnail.includes('supabase.co')) {
          await StorageManager.deleteLabelThumbnails(labelId);
        }
        
        // Upload new thumbnail to Supabase Storage
        const uploadResult = await StorageManager.uploadThumbnail({
          labelId,
          dataURL: thumbnailData
        });
        
        thumbnailUrl = uploadResult.url;
        thumbnailData = uploadResult.url; // Store URL instead of data URL
      } catch (uploadError) {
        // Log error but don't fail the entire operation
        Logger.error('Failed to upload thumbnail to storage:', uploadError);
        // Keep the data URL as fallback
      }
    }

    // Clear cache for this label and related data
    await CacheManager.delete(`label:${labelId}`);
    await CacheManager.delete(`project:${existingLabel.projectId}`);
    await CacheManager.deletePattern(`projects:${userId}:*`);

    // Prepare update data, excluding version from the update payload
    const { version: _, thumbnail: __, ...updateData } = value;

    const label = await prisma.label.update({
      where: { id: labelId },
      data: {
        ...updateData,
        thumbnail: thumbnailData,
        updatedAt: new Date(),
        version: { increment: 1 }
      }
    });

    res.status(200).json({
      success: true,
      message: 'Label updated successfully',
      data: label
    });
  } catch (error) {
    next(error);
  }
};

export const deleteLabel = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { labelId } = req.params;
    const userId = req.user!.id;

    if (!labelId) {
      throw createError('Label ID is required', 400);
    }

    // Check if label exists and user owns the project
    const existingLabel = await prisma.label.findFirst({
      where: { 
        id: labelId,
        project: { userId }
      }
    });

    if (!existingLabel) {
      throw createError('Label not found', 404);
    }

    // Delete thumbnails from storage before deleting label
    try {
      if (existingLabel.thumbnail && existingLabel.thumbnail.includes('supabase.co')) {
        await StorageManager.deleteLabelThumbnails(labelId);
      }
    } catch (storageError) {
      Logger.error('Failed to delete thumbnails during label deletion:', storageError);
      // Continue with label deletion even if storage cleanup fails
    }

    // Clear cache before deletion
    await CacheManager.delete(`label:${labelId}`);
    await CacheManager.delete(`project:${existingLabel.projectId}`);
    await CacheManager.deletePattern(`projects:${userId}:*`);

    await prisma.label.delete({
      where: { id: labelId }
    });

    res.status(200).json({
      success: true,
      message: 'Label deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Refresh thumbnail URL (for signed URLs that expire)
export const refreshThumbnailUrl = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { labelId } = req.params;
    const userId = req.user!.id;
    const { size = 'md' } = req.query;

    if (!labelId) {
      throw createError('Label ID is required', 400);
    }

    // Check if label exists and user owns the project
    const existingLabel = await prisma.label.findFirst({
      where: { 
        id: labelId,
        project: { userId }
      }
    });

    if (!existingLabel) {
      throw createError('Label not found', 404);
    }

    try {
      // Generate new signed URL using thumbnail service
      const newThumbnailUrl = await ThumbnailService.getThumbnailUrl(labelId, size as 'sm' | 'md' | 'lg');
      
      if (newThumbnailUrl) {
        // Update label with new URL
        const updatedLabel = await prisma.label.update({
          where: { id: labelId },
          data: {
            thumbnail: newThumbnailUrl,
            updatedAt: new Date()
          }
        });

        // Clear cache
        await CacheManager.delete(`label:${labelId}`);
        await CacheManager.delete(`project:${existingLabel.projectId}`);
        await CacheManager.deletePattern(`projects:${userId}:*`);

        res.status(200).json({
          success: true,
          data: {
            thumbnailUrl: newThumbnailUrl,
            label: updatedLabel
          }
        });
      } else {
        res.status(404).json({
          success: false,
          message: 'Thumbnail not found'
        });
      }
    } catch (storageError) {
      throw createError('Failed to refresh thumbnail URL', 500);
    }
  } catch (error) {
    next(error);
  }
};

// Export funkcje dla etykiet
export const exportProjectLabels = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { projectId } = req.params;
    const userId = req.user!.id;
    const { format = 'pdf', labelIds } = req.query;

    if (!projectId) {
      throw createError('Project ID is required', 400);
    }

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: { id: projectId, userId }
    });

    if (!project) {
      throw createError('Project not found', 404);
    }

    // Build query dla etykiet
    const whereClause: any = { projectId };
    
    // Jeśli labelIds są podane, eksportuj tylko wybrane etykiety
    if (labelIds) {
      const ids = Array.isArray(labelIds) ? labelIds : [labelIds];
      whereClause.id = { in: ids };
    }

    // Pobierz etykiety z wszystkimi danymi potrzebnymi do eksportu
    const labels = await prisma.label.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        width: true,
        height: true,
        fabricData: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { createdAt: 'asc' }
    });

    if (labels.length === 0) {
      throw createError('No labels found for export', 404);
    }

    // Na razie backend tylko przekazuje dane - frontend się zajmuje generowaniem PDF
    res.status(200).json({
      success: true,
      message: 'Export data retrieved successfully',
      data: {
        project: {
          id: project.id,
          name: project.name
        },
        labels,
        format,
        exportedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    next(error);
  }
};

// Export pojedynczej etykiety
export const exportLabel = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { labelId } = req.params;
    const userId = req.user!.id;
    const { format = 'pdf' } = req.query;

    if (!labelId) {
      throw createError('Label ID is required', 400);
    }

    // Check if label exists and user owns the project
    const label = await prisma.label.findFirst({
      where: { 
        id: labelId,
        project: { userId }
      },
      select: {
        id: true,
        name: true,
        width: true,
        height: true,
        fabricData: true,
        createdAt: true,
        updatedAt: true,
        project: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!label) {
      throw createError('Label not found', 404);
    }

    // Na razie backend tylko przekazuje dane - frontend się zajmuje generowaniem PDF
    res.status(200).json({
      success: true,
      message: 'Export data retrieved successfully',
      data: {
        project: label.project,
        labels: [label],
        format,
        exportedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    next(error);
  }
};
