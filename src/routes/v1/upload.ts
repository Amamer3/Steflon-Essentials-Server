import { Router } from 'express';
import { authenticateUser, requireAdmin } from '../../middleware/auth';
import { uploadProductImage, uploadProductImages } from '../../controllers/uploadController';

const router = Router();

// All upload routes require authentication and admin role
router.use(authenticateUser);
router.use(requireAdmin);

import { upload } from '../../middleware/upload';

// POST /api/v1/upload/product-image - Upload single product image
router.post('/product-image', upload.single('file'), uploadProductImage);

// POST /api/v1/upload/product-images - Upload multiple product images
router.post('/product-images', upload.array('files', 5), uploadProductImages);

export default router;

