import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';

export const corsMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const origin = req.headers.origin;
  
  // Allow requests from common frontend origins
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:5174',
    'https://steflon-essentials.vercel.app',
    env.FRONTEND_URL, 
  ].filter((url): url is string => !!url);

  const isAllowed = origin && (
    allowedOrigins.includes(origin) || 
    origin.endsWith('.vercel.app') || 
    allowedOrigins.some(ao => origin.startsWith(ao))
  );

  if (isAllowed) {
    res.setHeader('Access-Control-Allow-Origin', origin!);
  } else if (!origin) {
    // Allow requests with no origin (like mobile apps or curl)
    // res.setHeader('Access-Control-Allow-Origin', '*'); 
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }

  next();
};

