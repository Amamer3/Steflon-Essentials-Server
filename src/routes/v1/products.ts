import { Router } from 'express';
import { optionalAuth } from '../../middleware/auth';
import { getProducts, getProductById, getFeaturedProducts, getBestsellerProducts, getCategories } from '../../controllers/productController';

const router = Router();

// GET /api/v1/products - Get all products (with pagination, filtering, sorting)
router.get('/', optionalAuth, getProducts);

// GET /api/v1/products/featured - Get featured products
router.get('/featured', optionalAuth, getFeaturedProducts);

// GET /api/v1/products/bestsellers - Get bestseller products
router.get('/bestsellers', optionalAuth, getBestsellerProducts);

// GET /api/v1/products/:id - Get single product by ID
router.get('/:id', optionalAuth, getProductById);

// GET /api/v1/products/categories - Get all categories with product counts
router.get('/categories', optionalAuth, getCategories);

export default router;

