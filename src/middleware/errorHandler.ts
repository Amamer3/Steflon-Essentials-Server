import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
}

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  // Don't send error response if headers already sent
  if (res.headersSent) {
    console.error('❌ Error occurred after response was sent:', {
      message: err.message,
      path: req.path,
      method: req.method,
    });
    return;
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  // Log error with context
  console.error('❌ Application Error:', {
    message: err.message,
    statusCode,
    code: err.code,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method,
    originalUrl: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });

  // Don't expose internal errors in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  const errorResponse: any = {
    success: false,
    error: {
      message: statusCode >= 500 && !isDevelopment 
        ? 'Internal server error' 
        : message,
    },
  };

  // Include stack trace and details only in development
  if (isDevelopment) {
    errorResponse.error.stack = err.stack;
    if (err.code) {
      errorResponse.error.code = err.code;
    }
  }

  res.status(statusCode).json(errorResponse);
};

