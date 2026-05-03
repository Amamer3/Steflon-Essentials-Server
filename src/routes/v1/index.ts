import { Router } from 'express';
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

// Test route
router.get('/test', (_req, res) => {
  res.json({
    success: true,
    message: 'V1 routes are working!',
  });
});

// Auth routes
router.use('/auth', authRoutes);

// Product routes
router.use('/products', productRoutes);

// Cart routes
router.use('/cart', cartRoutes);

// Wishlist routes
router.use('/wishlist', wishlistRoutes);

// Order routes
router.use('/orders', orderRoutes);

// Address routes
router.use('/addresses', addressRoutes);

// Profile routes
router.use('/profile', profileRoutes);

// Admin routes
router.use('/admin', adminRoutes);

// Upload routes
router.use('/upload', uploadRoutes);

export default router;

