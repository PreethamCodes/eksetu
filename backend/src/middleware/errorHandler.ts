import { Request, Response, NextFunction } from 'express';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Safe server-side logging
  console.error('[EKSetu Error Handler]', err);

  const statusCode = err.status || err.statusCode || 500;
  let rawMessage = err.message || 'Internal Server Error';

  // Sanitize message to prevent leakage of credentials, file paths, or database URLs
  const forbiddenPatterns = [
    /postgres:\/\/[^\s]+/gi,
    /https:\/\/[a-z0-9]+\.supabase\.co[^\s]*/gi,
    /ey[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, // JWT / Service keys
    /[a-zA-Z]:\\[^\s]+/g, // Windows paths
    /\/home\/[^\s]+/g // Unix paths
  ];

  for (const pattern of forbiddenPatterns) {
    rawMessage = rawMessage.replace(pattern, '[REDACTED]');
  }

  // Never expose 500 internal details to client
  const clientMessage = statusCode >= 500
    ? 'An unexpected error occurred on the gateway. No sensitive information disclosed.'
    : rawMessage;

  const errorCode = err.code || (statusCode === 400 ? 'BAD_REQUEST' : statusCode === 403 ? 'FORBIDDEN' : statusCode === 404 ? 'NOT_FOUND' : 'GATEWAY_ERROR');

  res.status(statusCode).json({
    status: 'error',
    error: {
      code: errorCode,
      message: clientMessage
    },
    message: clientMessage,
    timestamp: new Date().toISOString()
  });
}
