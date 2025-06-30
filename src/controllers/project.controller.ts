import { Request, Response, NextFunction } from 'express';
import { prisma } from '../services/database.service';
import { createError } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { createProjectSchema, updateProjectSchema, createLabelSchema, updateLabelSchema } from '../validation/project.validation';

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
              status: true,
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
    const { sortBy = 'updatedAt', sortOrder = 'desc', status, search } = req.query;

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
    if (status) {
      whereClause.status = status;
    }
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

export const updateLabel = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
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

    // Store thumbnail data received from frontend (generated by Fabric.js)
    let thumbnailData = value.thumbnail;
    // Keep existing thumbnail from frontend, don't generate on backend

    const label = await prisma.label.update({
      where: { id: labelId },
      data: {
        ...value,
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

export const duplicateLabel = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
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

    const duplicatedLabel = await prisma.label.create({
      data: {
        name: `${existingLabel.name} (Copy)`,
        description: existingLabel.description,
        projectId: existingLabel.projectId,
        fabricData: existingLabel.fabricData as any,
        width: existingLabel.width,
        height: existingLabel.height,
        status: 'DRAFT'
      }
    });

    res.status(201).json({
      success: true,
      message: 'Label duplicated successfully',
      data: duplicatedLabel
    });
  } catch (error) {
    next(error);
  }
};
