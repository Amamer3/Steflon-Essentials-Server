import { Router, Request, Response } from 'express';
import { auth } from '../config/auth';
import v1Routes from './v1';
import docsRoutes from './docs';

const router = Router();

// BetterAuth routes - handle all auth endpoints (sign-up, sign-in, sign-out, get-session)
// Use router.use to catch all /auth routes
router.use('/auth', async (req: Request, res: Response): Promise<void> => {
  try {
    // Safely construct URL - validate host header to prevent host header injection
    const host = req.headers.host || 'localhost:3000';
    // Only allow alphanumeric, dots, colons, and hyphens in host
    if (!/^[a-zA-Z0-9.:-]+$/.test(host)) {
      res.status(400).json({ error: 'Invalid host header' }); 
      return;
    }
    
    // When using router.use('/auth', ...), req.path has /auth stripped
    // So for /api/auth/sign-up, req.path will be '/sign-up'
    const authPath = req.path || '/';
    const baseUrl = `http://${host}`;
    const url = new URL(`/api/auth${authPath}`, baseUrl);
    
    console.log('Main routes - BetterAuth handler:', { path: req.path, authPath, url: url.toString() });
    
    const headers = new Headers();
    Object.entries(req.headers).forEach(([key, value]) => {
      if (value && typeof value === 'string') {
        headers.set(key, value);
      } else if (value && Array.isArray(value)) {
        headers.set(key, value.join(', '));
      }
    });
    
    const WebAPIRequest = (globalThis as any).Request;
    const webReq = new WebAPIRequest(url.toString(), {
      method: req.method,
      headers: headers,
      body: req.method !== 'GET' && req.method !== 'HEAD' ? JSON.stringify(req.body) : undefined,
    });

    const webRes = await auth.handler(webReq);
    
    // Convert Web API response to Express response
    res.status(webRes.status);
    webRes.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });
    
    const body = await webRes.text();
    if (body) {
      try {
        const json = JSON.parse(body);
        res.json(json);
      } catch {
        // Only send text if it's safe (BetterAuth responses should be JSON)
        res.type('text/plain').send(body);
      }
    } else {
      res.end();
    }
  } catch (error) {
    console.error('❌ Auth handler error:', {
      error: error instanceof Error ? error.message : String(error),
      stack: process.env.NODE_ENV === 'development' && error instanceof Error ? error.stack : undefined,
      path: req.path,
      method: req.method,
    });
    
    if (!res.headersSent) {
      const statusCode = error instanceof Error && 'statusCode' in error 
        ? (error as any).statusCode 
        : 500;
      
      res.status(statusCode).json({
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Internal server error',
          ...(process.env.NODE_ENV === 'development' && {
            details: error instanceof Error ? error.stack : String(error),
          }),
        },
      });
    }
  }
});

// Admin auth endpoint (POST /api/admin/auth/sign-in)
router.post('/admin/auth/sign-in', async (req: Request, res: Response): Promise<void> => {
  // This will be handled by BetterAuth, but we need to verify admin role after login
  // For now, redirect to BetterAuth sign-in
  try {
    const host = req.headers.host || 'localhost:3000';
    const url = `http://${host}/api/auth/sign-in`;
    
    const headers = new Headers();
    Object.entries(req.headers).forEach(([key, value]) => {
      if (value && typeof value === 'string') {
        headers.set(key, value);
      } else if (value && Array.isArray(value)) {
        headers.set(key, value.join(', '));
      }
    });
    
    const webReq = new Request(url, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(req.body),
    });

    const webRes = await auth.handler(webReq);
    
    res.status(webRes.status);
    webRes.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });
    
    const body = await webRes.text();
    if (body) {
      try {
        const json = JSON.parse(body);
        // Verify admin role if login successful
        if (webRes.status === 200 && json.user) {
          // Check if user is admin (this should be done in the user document)
          // For now, we'll return the response as-is
        }
        res.json(json);
      } catch {
        res.type('text/plain').send(body);
      }
    } else {
      res.end();
    }
  } catch (error) {
    console.error('Admin auth error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// API v1 routes
router.use('/v1', v1Routes);

// API Documentation (Scalar)
router.use('/docs', docsRoutes);

// Health check
router.get('/health', (_req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

export default router;

