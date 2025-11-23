import { Router } from 'express';
import { authenticateUser, requireAdmin } from '../../middleware/auth';
import { uploadProductImage, uploadProductImages } from '../../controllers/uploadController';

const router = Router();

// All upload routes require authentication and admin role
router.use(authenticateUser);
router.use(requireAdmin);

// POST /api/v1/upload/product-image - Upload single product image
router.post('/product-image', uploadProductImage);

// POST /api/v1/upload/product-images - Upload multiple product images
router.post('/product-images', uploadProductImages);

export default router;

