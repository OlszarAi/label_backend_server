import { Request, Response, NextFunction } from 'express';
import { Logger, colors } from '../utils/logger';
import { config } from '../config/config';

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const startTime = Date.now();
  const originalSend = res.send;
  
  // Override res.send to capture response
  res.send = function(body) {
    const duration = Date.now() - startTime;
    const statusCode = res.statusCode;
    const method = req.method;
    const url = req.originalUrl;
    const ip = req.ip || req.connection.remoteAddress || '::1';
    
    // Color code based on status
    let statusIcon = '';
    if (statusCode >= 200 && statusCode < 300) {
      statusIcon = '✅'; // Green for success
    } else if (statusCode >= 300 && statusCode < 400) {
      statusIcon = '�'; // Blue for redirect
    } else if (statusCode >= 400 && statusCode < 500) {
      statusIcon = '⚠️ '; // Orange for client error
    } else if (statusCode >= 500) {
      statusIcon = '❌'; // Red for server error
    }
    
    // Compact log format
    const shortIp = ip === '::1' || ip === '127.0.0.1' ? 'local' : ip.substring(0, 10);
    Logger.info(`${statusIcon} ${method.padEnd(4)} ${url.padEnd(20)} ${statusCode} ${duration}ms ${colors.dim}(${shortIp})${colors.reset}`);
    
    // Log detailed info for errors in development only
    if (statusCode >= 400 && config.nodeEnv === 'development') {
      // Create a safe copy of the body without sensitive data for error logging
      const safeErrorBody = { ...req.body };
      if (safeErrorBody.password) {
        safeErrorBody.password = '[FILTERED]';
      }
      if (safeErrorBody.currentPassword) {
        safeErrorBody.currentPassword = '[FILTERED]';
      }
      if (safeErrorBody.newPassword) {
        safeErrorBody.newPassword = '[FILTERED]';
      }
      
      Logger.debug(`Error details: ${statusCode} - ${url} - ${JSON.stringify(safeErrorBody)}`);
    }
    
    return originalSend.call(this, body);
  };
  
  next();
}

export function apiLogger(req: Request, res: Response, next: NextFunction) {
  const method = req.method;
  const url = req.originalUrl;
  
  // Only log in development mode for API debugging
  if (config.nodeEnv === 'development') {
    Logger.debug(`🌐 ${method} ${url}`);
    
    if (req.body && Object.keys(req.body).length > 0) {
      // Create a safe copy of the body without sensitive data
      const safeBody = { ...req.body };
      
      // Remove sensitive fields
      if (safeBody.password) {
        safeBody.password = '[FILTERED]';
      }
      if (safeBody.currentPassword) {
        safeBody.currentPassword = '[FILTERED]';
      }
      if (safeBody.newPassword) {
        safeBody.newPassword = '[FILTERED]';
      }
      
      // Filter out large base64 data (thumbnails, images)
      if (safeBody.thumbnail && typeof safeBody.thumbnail === 'string' && safeBody.thumbnail.startsWith('data:')) {
        safeBody.thumbnail = '[BASE64_IMAGE_FILTERED]';
      }
      if (safeBody.fabricData && typeof safeBody.fabricData === 'object') {
        // Don't log full fabricData as it can be very large
        safeBody.fabricData = '[FABRIC_DATA_FILTERED]';
      }
      
      Logger.debug(`📝 Body: ${JSON.stringify(safeBody)}`);
    }
  }
  
  next();
}
