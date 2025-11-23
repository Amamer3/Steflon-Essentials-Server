import { Request, Response, NextFunction } from 'express';
import { getCurrentUser } from '../services/authService';

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        name?: string;
        role?: string;
        [key: string]: any;
      };
    }
  }
}

/**
 * Middleware to authenticate user via BetterAuth session
 */
export async function authenticateUser(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = await getCurrentUser(req);

    if (!user) {
      res.status(401).json({ error: 'Unauthorized: Invalid or expired session' });
      return;
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ error: 'Unauthorized: Authentication failed' });
  }
}

/**
 * Middleware to check if user is admin
 */
export function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  if (req.user.role !== 'admin') {
    res.status(403).json({ error: 'Forbidden: Admin access required' });
    return;
  }

  next();
}

/**
 * Optional authentication - attaches user if session is valid, but doesn't fail if missing
 */
export async function optionalAuth(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = await getCurrentUser(req);
    if (user) {
      req.user = user;
    }
  } catch (error) {
    // Silently fail for optional auth
    console.debug('Optional auth failed:', error);
  }

  next();
}

