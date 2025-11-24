import { Router, Request as ExpressRequest, Response } from 'express';
import { auth } from '../../config/auth';
import authRoutes from './auth';
import productRoutes from './products';
import cartRoutes from './cart';
import wishlistRoutes from './wishlist';
import orderRoutes from './orders';
import addressRoutes from './addresses';
import profileRoutes from './profile';
import adminRoutes from './admin';
import uploadRoutes from './upload';

const router = Router();

// Test route to verify v1 routes are working
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'V1 routes are working!',
    path: req.path,
    originalUrl: req.originalUrl,
    baseUrl: req.baseUrl,
    url: req.url
  });
});

// Debug: Log all incoming requests to v1 router
router.use((req, _res, next) => {
  if (req.path.startsWith('/auth')) {
    console.log('🔍 V1 Router - Auth request:', {
      method: req.method,
      path: req.path,
      originalUrl: req.originalUrl,
      url: req.url,
      baseUrl: req.baseUrl
    });
  }
  next();
});

// Helper function to forward BetterAuth requests
async function handleBetterAuth(req: ExpressRequest, res: Response, authPath: string): Promise<void> {
  try {
    console.log('🔄 handleBetterAuth called with path:', authPath);

    // Safely construct URL - validate host header to prevent host header injection
    const host = req.headers.host || 'localhost:3000';
    // Only allow alphanumeric, dots, colons, and hyphens in host
    if (!/^[a-zA-Z0-9.:-]+$/.test(host)) {
      console.error('❌ Invalid host header:', host);
      res.status(400).json({ error: 'Invalid host header' });
      return;
    }


    // BetterAuth expects requests at /api/auth/* by default
    // The handler needs the full URL matching the baseURL
    const baseUrl = `http://${host}`;
    const fullPath = `/api/auth${authPath}`;
    const url = new URL(fullPath, baseUrl);
    console.log('🔄 Forwarding to BetterAuth:', {
      fullPath,
      url: url.toString(),
      urlPathname: url.pathname,
      host,
      baseURL: 'http://localhost:5000' // BetterAuth's configured baseURL
    });

    const headers = new Headers();
    Object.entries(req.headers).forEach(([key, value]) => {
      // Skip host header as it might conflict with the URL
      if (key.toLowerCase() === 'host') return;
      if (value && typeof value === 'string') {
        headers.set(key, value);
      } else if (value && Array.isArray(value)) {
        headers.set(key, value.join(', '));
      }
    });

    // Use global Request constructor (Web API Request, not Express Request)
    const WebAPIRequest = (globalThis as any).Request;
    if (!WebAPIRequest) {
      console.error('❌ WebAPI Request constructor not available');
      res.status(500).json({ error: 'Request constructor not available' });
      return;
    }

    // Create request with full URL - BetterAuth will parse it
    // Try using the full URL first, as BetterAuth might need it to match baseURL
    const requestUrl = url.toString();
    const webReq = new WebAPIRequest(requestUrl, {
      method: req.method,
      headers: headers,
      body: req.method !== 'GET' && req.method !== 'HEAD' ? JSON.stringify(req.body) : undefined,
    });

    console.log('🔄 Calling auth.handler with URL:', requestUrl, 'Pathname:', url.pathname);
    console.log('🔄 Request details:', {
      method: webReq.method,
      url: webReq.url,
      urlPathname: new URL(webReq.url).pathname,
      headers: Object.fromEntries(webReq.headers.entries())
    });

    const webRes = await auth.handler(webReq);
    console.log('✅ BetterAuth response received:', webRes.status, 'Status text:', webRes.statusText);

    // Convert Web API response to Express response
    res.status(webRes.status);
    webRes.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });

    // Read response body once
    const body = await webRes.text();
    console.log('📄 BetterAuth response body length:', body.length);
    if (body) {
      console.log('📄 BetterAuth response body:', body.substring(0, 500));
    } else {
      console.log('📄 BetterAuth response body is empty');
    }
    if (body) {
      try {
        const json = JSON.parse(body);
        console.log('✅ Sending JSON response');
        res.json(json);
      } catch {
        console.log('✅ Sending text response');
        res.type('text/plain').send(body);
      }
    } else {
      console.log('✅ Sending empty response');
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
}


router.post('/auth/sign-up', async (req, res) => {
  try {
    console.log('✅ Sign-up POST route hit!', {
      method: req.method,
      path: req.path,
      originalUrl: req.originalUrl,
      url: req.url,
      baseUrl: req.baseUrl
    });
    // BetterAuth uses /sign-up/email for email/password sign-up
    await handleBetterAuth(req, res, '/sign-up/email');
  } catch (error) {
    console.error('❌ Sign-up route error:', error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to process sign-up request',
          ...(process.env.NODE_ENV === 'development' && {
            details: error instanceof Error ? error.message : String(error),
          }),
        },
      });
    }
  }
});
router.post('/auth/sign-in', async (req, res) => await handleBetterAuth(req, res, '/sign-in/email'));
router.post('/auth/sign-out', async (req, res) => await handleBetterAuth(req, res, '/sign-out'));
router.get('/auth/get-session', async (req, res) => await handleBetterAuth(req, res, '/get-session'));

// Catch-all for other auth routes - must be last
router.use('/auth', async (req, res) => {
  console.log('✅ Auth catch-all hit!', req.method, req.path, req.originalUrl);
  // Extract path - when using router.use, req.path has /auth stripped
  const authPath = req.path || '/';
  await handleBetterAuth(req, res, authPath);
});

// ==========================================
// Public Routes (No Authentication Required)
// ==========================================
router.use('/products', productRoutes);
router.use('/upload', uploadRoutes); // Note: Upload might need auth in production, but currently treated as public or handled internally

// ==========================================
// Authentication Routes (BetterAuth)
// ==========================================
// These are handled by the main router's /auth handler, but we expose them here for completeness if needed
// or specific v1 auth extensions
router.use('/user', authRoutes);

// ==========================================
// Protected User Routes (Authentication Required)
// ==========================================
router.use('/cart', cartRoutes);
router.use('/wishlist', wishlistRoutes);
router.use('/orders', orderRoutes);
router.use('/addresses', addressRoutes);
router.use('/profile', profileRoutes);

// ==========================================
// Admin Routes (Authentication & Admin Role Required)
// ==========================================
router.use('/admin', adminRoutes);

export default router;

