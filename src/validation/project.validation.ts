import Joi from 'joi';

export const createProjectSchema = Joi.object({
  name: Joi.string().min(1).max(100).required().messages({
    'string.empty': 'Project name is required',
    'string.min': 'Project name must be at least 1 character long',
    'string.max': 'Project name cannot exceed 100 characters'
  }),
  description: Joi.string().max(500).allow('').optional().messages({
    'string.max': 'Description cannot exceed 500 characters'
  }),
  icon: Joi.string().max(10).allow('').optional().messages({
    'string.max': 'Icon cannot exceed 10 characters'
  }),
  color: Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/).optional().messages({
    'string.pattern.base': 'Color must be a valid hex color (e.g., #3b82f6)'
  })
});

export const updateProjectSchema = Joi.object({
  name: Joi.string().min(1).max(100).optional().messages({
    'string.empty': 'Project name cannot be empty',
    'string.min': 'Project name must be at least 1 character long',
    'string.max': 'Project name cannot exceed 100 characters'
  }),
  description: Joi.string().max(500).allow('').optional().messages({
    'string.max': 'Description cannot exceed 500 characters'
  }),
  icon: Joi.string().max(10).allow('').optional().messages({
    'string.max': 'Icon cannot exceed 10 characters'
  }),
  color: Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/).optional().messages({
    'string.pattern.base': 'Color must be a valid hex color (e.g., #3b82f6)'
  })
});

export const createLabelSchema = Joi.object({
  name: Joi.string().min(1).max(100).required().messages({
    'string.empty': 'Label name is required',
    'string.min': 'Label name must be at least 1 character long',
    'string.max': 'Label name cannot exceed 100 characters'
  }),
  description: Joi.string().max(500).allow('').optional().messages({
    'string.max': 'Description cannot exceed 500 characters'
  }),
  width: Joi.number().positive().max(1000).optional().messages({
    'number.positive': 'Width must be a positive number',
    'number.max': 'Width cannot exceed 1000mm'
  }),
  height: Joi.number().positive().max(1000).optional().messages({
    'number.positive': 'Height must be a positive number',
    'number.max': 'Height cannot exceed 1000mm'
  }),
  fabricData: Joi.object().optional(),
  thumbnail: Joi.string().optional(),
  status: Joi.string().valid('DRAFT', 'PUBLISHED', 'ARCHIVED').optional()
});

export const updateLabelSchema = Joi.object({
  name: Joi.string().min(1).max(100).optional().messages({
    'string.empty': 'Label name cannot be empty',
    'string.min': 'Label name must be at least 1 character long',
    'string.max': 'Label name cannot exceed 100 characters'
  }),
  description: Joi.string().max(500).allow('').optional().messages({
    'string.max': 'Description cannot exceed 500 characters'
  }),
  width: Joi.number().positive().max(1000).optional().messages({
    'number.positive': 'Width must be a positive number',
    'number.max': 'Width cannot exceed 1000mm'
  }),
  height: Joi.number().positive().max(1000).optional().messages({
    'number.positive': 'Height must be a positive number',
    'number.max': 'Height cannot exceed 1000mm'
  }),
  fabricData: Joi.object().optional(),
  thumbnail: Joi.string().optional(),
  status: Joi.string().valid('DRAFT', 'PUBLISHED', 'ARCHIVED').optional()
});
