import { Router } from 'express';
import {
  getAdminProducts,
  getAdminProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  updateProductStock,
  updateProductStatus,
} from '../../../controllers/admin/productController';

const router = Router();

// GET /api/v1/admin/products - Get all products with advanced filtering
router.get('/', getAdminProducts);

// GET /api/v1/admin/products/:id - Get single product (admin view)
router.get('/:id', getAdminProductById);

// POST /api/v1/admin/products - Create new product
router.post('/', createProduct);

// PUT /api/v1/admin/products/:id - Update product
router.put('/:id', updateProduct);

// DELETE /api/v1/admin/products/:id - Delete product
router.delete('/:id', deleteProduct);

// PUT /api/v1/admin/products/:id/stock - Update product stock
router.put('/:id/stock', updateProductStock);

// PUT /api/v1/admin/products/:id/status - Update product status
router.put('/:id/status', updateProductStatus);

export default router;

