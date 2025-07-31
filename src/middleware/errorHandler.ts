import { Request, Response, NextFunction } from 'express';
import { Logger } from '../utils/logger';

export interface ApiError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export const errorHandler = (
  error: ApiError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal Server Error';
  
  // Log error details with better formatting
  const errorDetails = {
    statusCode,
    message,
    url: req.url,
    method: req.method,
    ip: req.ip || 'Unknown',
    userAgent: req.get('User-Agent') || 'Unknown',
    body: req.body,
    query: req.query,
    params: req.params,
  };

  if (statusCode >= 500) {
    Logger.error(`🚨 Server Error (${statusCode}): ${message}`, error);
    if (process.env.NODE_ENV === 'development') {
      Logger.error(`Request details: ${JSON.stringify(errorDetails, null, 2)}`);
    }
  } else if (statusCode >= 400) {
    Logger.warning(`⚠️  Client Error (${statusCode}): ${message}`);
    if (process.env.NODE_ENV === 'development') {
      Logger.debug(`Request details: ${JSON.stringify(errorDetails, null, 2)}`);
    }
  }

  // Don't expose internal errors in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  res.status(statusCode).json({
    success: false,
    error: {
      message: statusCode === 500 && !isDevelopment ? 'Internal Server Error' : message,
      statusCode,
      ...(isDevelopment && { stack: error.stack }),
    },
  });
};

export const createError = (message: string, statusCode: number = 500): ApiError => {
  const error: ApiError = new Error(message);
  error.statusCode = statusCode;
  error.isOperational = true;
  return error;
};
