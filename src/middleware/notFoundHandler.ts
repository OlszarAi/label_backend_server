import { Request, Response } from 'express';
import { Logger } from '../utils/logger';

export const notFoundHandler = (req: Request, res: Response) => {
  const message = `Route ${req.method} ${req.path} not found`;
  
  Logger.warning(`🔍 ${message} - IP: ${req.ip || 'Unknown'}`);
  
  res.status(404).json({
    success: false,
    error: {
      message,
      statusCode: 404,
    },
  });
};
