import { Request, Response, NextFunction } from 'express';
import { prisma } from '../services/database.service';
import { createError } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { createProjectSchema, updateProjectSchema, createLabelSchema, updateLabelSchema } from '../validation/project.validation';
import { generateCopyName, type LabelForNaming } from '../utils/labelNaming';

export const getProjects = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { page = 1, limit = 10, search } = req.query;
    
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

    res.status(200).json({
      success: true,
      data: {
        projects,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: totalCount,
          totalPages: Math.ceil(totalCount / Number(limit))
        }
      }
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

    res.status(200).json({
      success: true,
      data: labels
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

    // Store thumbnail data received from frontend (generated by Fabric.js)
    let thumbnailData = value.thumbnail;
    // Keep existing thumbnail from frontend, don't generate on backend

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

    // Store thumbnail data received from frontend (generated by Fabric.js)
    let thumbnailData = value.thumbnail;
    // Keep existing thumbnail from frontend, don't generate on backend

    // Prepare update data, excluding version from the update payload
    const { version: _, ...updateData } = value;

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
