import { Request, Response } from 'express';
import { db } from '../config/firestore';
import { Product } from '../types';

/**
 * Helper to convert Firestore timestamp to Date
 */
function convertTimestamp(data: any): any {
  if (!data) return null;
  const converted: any = { ...data };
  Object.keys(converted).forEach((key) => {
    if (converted[key] && typeof converted[key] === 'object' && converted[key].toDate) {
      converted[key] = converted[key].toDate();
    }
  });
  return converted;
}

/**
 * GET /api/v1/products - Get all products with filtering, pagination, sorting
 */
export async function getProducts(req: Request, res: Response): Promise<void> {
  try {
    const {
      page = '1',
      limit = '12',
      category,
      search,
      sort = 'createdAt',
      order = 'desc',
      minPrice,
      maxPrice,
      status,
    } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    let query = db.collection('products') as any;

    // Apply filters
    if (category) {
      query = query.where('category', '==', category);
    }
    if (status) {
      query = query.where('status', '==', status);
    } else {
      query = query.where('status', '==', 'Active');
    }
    if (minPrice) {
      query = query.where('price', '>=', parseFloat(minPrice as string));
    }
    if (maxPrice) {
      query = query.where('price', '<=', parseFloat(maxPrice as string));
    }

    // Get total count
    const countSnapshot = await query.get();
    const total = countSnapshot.size;

    // Apply pagination and sorting
    query = query.orderBy(sort as string, order as 'asc' | 'desc');
    query = query.limit(limitNum).offset(skip);

    const snapshot = await query.get();
    let products = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...convertTimestamp(doc.data()),
    })) as Product[];

    // Apply search filter (client-side for Firestore limitations)
    if (search) {
      const searchLower = (search as string).toLowerCase();
      products = products.filter(
        (p) =>
          p.name.toLowerCase().includes(searchLower) ||
          p.description?.toLowerCase().includes(searchLower) ||
          p.sku?.toLowerCase().includes(searchLower)
      );
    }

    res.json({
      success: true,
      data: products,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Error getting products:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * GET /api/v1/products/:id - Get single product by ID
 */
export async function getProductById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const doc = await db.collection('products').doc(id).get();

    if (!doc.exists) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    const product = {
      id: doc.id,
      ...convertTimestamp(doc.data()),
    } as Product;

    res.json({ success: true, data: product });
  } catch (error) {
    console.error('Error getting product:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * GET /api/v1/products/featured - Get featured products
 */
export async function getFeaturedProducts(req: Request, res: Response): Promise<void> {
  try {
    const { limit = '12' } = req.query;
    const limitNum = parseInt(limit as string, 10);

    const snapshot = await db
      .collection('products')
      .where('featured', '==', true)
      .where('status', '==', 'Active')
      .orderBy('createdAt', 'desc')
      .limit(limitNum)
      .get();

    const products = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...convertTimestamp(doc.data()),
    })) as Product[];

    res.json({ success: true, data: products });
  } catch (error) {
    console.error('Error getting featured products:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * GET /api/v1/products/bestsellers - Get bestseller products
 */
export async function getBestsellerProducts(req: Request, res: Response): Promise<void> {
  try {
    const { limit = '12' } = req.query;
    const limitNum = parseInt(limit as string, 10);

    const snapshot = await db
      .collection('products')
      .where('bestseller', '==', true)
      .where('status', '==', 'Active')
      .orderBy('createdAt', 'desc')
      .limit(limitNum)
      .get();

    const products = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...convertTimestamp(doc.data()),
    })) as Product[];

    res.json({ success: true, data: products });
  } catch (error) {
    console.error('Error getting bestseller products:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * GET /api/v1/products/categories - Get all categories with product counts
 */
export async function getCategories(_req: Request, res: Response): Promise<void> {
  try {
    const categoriesSnapshot = await db.collection('categories').get();
    const categories = await Promise.all(
      categoriesSnapshot.docs.map(async (doc: any) => {
        const categoryData = convertTimestamp(doc.data());
        // Get product count for this category
        const productsSnapshot = await db
          .collection('products')
          .where('category', '==', categoryData.name)
          .where('status', '==', 'Active')
          .get();

        return {
          id: doc.id,
          ...categoryData,
          productCount: productsSnapshot.size,
        };
      })
    );

    res.json({ success: true, data: categories });
  } catch (error) {
    console.error('Error getting categories:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

