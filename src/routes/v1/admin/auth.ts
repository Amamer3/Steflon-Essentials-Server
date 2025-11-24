import { Router, Request, Response } from 'express';
import { getCurrentUser } from '../../../services/authService';
import { authenticateUser } from '../../../middleware/auth';
import { auth } from '../../../config/auth';
import { db } from '../../../config/firestore';

const router = Router();

// GET /api/v1/admin/auth/me - Get current admin
router.get('/me', authenticateUser, async (req: Request, res: Response) => {
  try {
    const user = await getCurrentUser(req);
    if (!user || user.role !== 'admin') {
      res.status(403).json({ error: 'Forbidden: Admin access required' });
      return;
    }

    const { password, ...adminProfile } = user as any;
    res.json({ success: true, data: adminProfile });
  } catch (error) {
    console.error('Error getting admin profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/v1/admin/auth/sign-in - Admin login
router.post('/sign-in', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Forward to BetterAuth for authentication
    const host = req.headers.host || 'localhost:3000';
    const baseUrl = `http://${host}`;
    const fullPath = `/api/auth/sign-in/email`;
    const url = new URL(fullPath, baseUrl);

    const headers = new Headers();
    headers.set('content-type', 'application/json');

    // Copy other headers except host
    Object.entries(req.headers).forEach(([key, value]) => {
      if (key.toLowerCase() === 'host' || key.toLowerCase() === 'content-type') return;
      if (value && typeof value === 'string') {
        headers.set(key, value);
      } else if (value && Array.isArray(value)) {
        headers.set(key, value.join(', '));
      }
    });

    const WebAPIRequest = (globalThis as any).Request;
    const webReq = new WebAPIRequest(url.toString(), {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({ email, password }),
    });

    const webRes = await auth.handler(webReq);

    // If authentication successful, verify admin role
    if (webRes.status === 200) {
      // Check if user has admin role in database
      const usersSnap = await db.collection('users').where('email', '==', email).get();

      if (!usersSnap.empty) {
        const user = usersSnap.docs[0].data();

        if (user.role !== 'admin') {
          // User authenticated but is not an admin
          res.status(403).json({
            success: false,
            error: 'Access denied: Admin privileges required'
          });
          return;
        }
      } else {
        // User authenticated but not found in database (shouldn't happen)
        res.status(403).json({
          success: false,
          error: 'User account not found'
        });
        return;
      }
    }

    // Forward the response from BetterAuth
    res.status(webRes.status);
    webRes.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });

    const bodyText = await webRes.text();
    res.send(bodyText);

  } catch (error) {
    console.error('Error in admin sign-in:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// POST /api/v1/admin/auth/create-admin - Create new admin user
// This should be protected - only existing admins can create new admins
// For initial setup, you may want to temporarily allow this without auth
router.post('/create-admin', async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;

    // Validate required fields
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({ error: 'Invalid email format' });
      return;
    }

    // Validate password strength
    if (password.length < 8) {
      res.status(400).json({ error: 'Password must be at least 8 characters long' });
      return;
    }

    // Check if user already exists
    const existingUser = await db.collection('users').where('email', '==', email).get();
    if (!existingUser.empty) {
      res.status(409).json({ error: 'User with this email already exists' });
      return;
    }

    // Create user using BetterAuth's internal API
    // This ensures the user is created with proper password hashing
    const host = req.headers.host || 'localhost:3000';
    const baseUrl = `http://${host}`;
    const url = new URL('/api/auth/sign-up/email', baseUrl);

    const headers = new Headers();
    headers.set('content-type', 'application/json');

    const WebAPIRequest = (globalThis as any).Request;
    const webReq = new WebAPIRequest(url.toString(), {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({ email, password, name: name || 'Admin User' }),
    });

    const webRes = await auth.handler(webReq);

    if (webRes.status !== 200 && webRes.status !== 201) {
      const errorBody = await webRes.text();
      res.status(webRes.status).json({ error: errorBody || 'Failed to create user' });
      return;
    }

    // Update the user role to admin
    const userSnapshot = await db.collection('users').where('email', '==', email).get();
    if (!userSnapshot.empty) {
      const userId = userSnapshot.docs[0].id;
      await db.collection('users').doc(userId).update({
        role: 'admin',
        status: 'Active',
        updatedAt: new Date(),
      });

      const userData = userSnapshot.docs[0].data();
      const { password: _, ...adminData } = userData as any;

      res.status(201).json({
        success: true,
        message: 'Admin user created successfully',
        data: {
          id: userId,
          ...adminData,
          role: 'admin',
        },
      });
    } else {
      res.status(500).json({ error: 'User created but role update failed' });
    }
  } catch (error) {
    console.error('Error creating admin user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
