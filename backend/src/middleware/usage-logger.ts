import { Request, Response, NextFunction } from 'express';
import { query } from '../db/connection';

/**
 * Middleware to log API usage for authenticated requests
 */
export const logApiUsage = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const startTime = Date.now();

  // Store original send function
  const originalSend = res.send;

  // Override send to capture response
  res.send = function (data: any): Response {
    const responseTime = Date.now() - startTime;

    // Log usage asynchronously (don't block response)
    if (req.user || req.apiKeyUser) {
      const userId = req.user?.id || req.apiKeyUser?.user_id;
      const apiKeyId = req.apiKeyUser?.api_key_id || null;

      query(
        `INSERT INTO usage_logs (user_id, api_key_id, endpoint, method, status_code, response_time_ms)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [userId, apiKeyId, req.path, req.method, res.statusCode, responseTime]
      ).catch((error) => {
        console.error('Failed to log API usage:', error);
      });
    }

    // Call original send
    return originalSend.call(this, data);
  };

  next();
};

