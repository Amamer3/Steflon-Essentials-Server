import { Request } from 'express';
import { auth } from '../config/auth';
import { db } from '../config/firestore';

/**
 * Get current user from request session
 */
export async function getCurrentUser(req: Request) {
  try {
    // Create a Web API Request for BetterAuth
    const host = req.headers.host || 'localhost:3000';
    const protocol = req.protocol || 'http';
    const url = `${protocol}://${host}${req.originalUrl}`;

    const headers = new Headers();
    Object.entries(req.headers).forEach(([key, value]) => {
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
      return null;
    }

    const webReq = new WebAPIRequest(url, {
      method: req.method,
      headers: headers,
    });

    // Get session from BetterAuth
    const session = await auth.api.getSession({ headers: webReq.headers });

    if (!session || !session.user) {
      return null;
    }

    // Get full user data from Firestore
    const userDoc = await db.collection('users').doc(session.user.id).get();

    if (!userDoc.exists) {
      return null;
    }

    const userData = userDoc.data();
    return {
      id: userDoc.id,
      email: userData?.email || session.user.email,
      name: userData?.name,
      role: userData?.role || 'user',
      ...userData,
    };
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

