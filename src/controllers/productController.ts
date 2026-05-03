import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin as supabase } from '../config/supabase';

/**
 * GET /api/v1/products - Get all products with filtering, pagination, sorting
 */
export async function getProducts(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const {
      page = '1',
      limit = '12',
      category,
      search,
      sort = 'created_at',
      order = 'desc',
      minPrice,
      maxPrice,
      status,
    } = req.query;

    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 12;
    const from = (pageNum - 1) * limitNum;
    const to = from + limitNum - 1;

    let query = supabase.from('products').select('*', { count: 'exact' });

    // Apply filters
    if (category) {
      query = query.eq('category', category);
    }
    if (status) {
      query = query.eq('status', status);
    } else {
      query = query.eq('status', 'Active');
    }
    if (minPrice) {
      query = query.gte('price', parseFloat(minPrice as string));
    }
    if (maxPrice) {
      query = query.lte('price', parseFloat(maxPrice as string));
    }

    // Apply search filter
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%,sku.ilike.%${search}%`);
    }

    // Apply sorting
    query = query.order(sort as string, { ascending: order === 'asc' });

    // Apply pagination
    query = query.range(from, to);

    const { data: products, error, count } = await query;

    if (error) throw error;

    res.json({
      success: true,
      data: products,
      pagination: {
        total: count || 0,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil((count || 0) / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/products/:id - Get single product by ID
 */
export async function getProductById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const { data: product, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !product) {
      res.status(404).json({ success: false, error: 'Product not found' });
      return;
    }

    res.json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/products/featured - Get featured products
 */
export async function getFeaturedProducts(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { limit = '12' } = req.query;
    const limitNum = parseInt(limit as string, 10) || 12;

    const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .eq('featured', true)
      .eq('status', 'Active')
      .order('created_at', { ascending: false })
      .limit(limitNum);

    if (error) throw error;

    res.json({ success: true, data: products });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/products/bestsellers - Get bestseller products
 */
export async function getBestsellerProducts(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { limit = '12' } = req.query;
    const limitNum = parseInt(limit as string, 10) || 12;

    const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .eq('bestseller', true)
      .eq('status', 'Active')
      .order('created_at', { ascending: false })
      .limit(limitNum);

    if (error) throw error;

    res.json({ success: true, data: products });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/products/categories - Get all unique categories
 */
export async function getCategories(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // In Supabase/PostgreSQL we can use select('category').distinct()
    // but the JS client doesn't have a direct .distinct().
    // We can use a raw query or just fetch categories and filter in JS if the set is small.
    // Or better: use a RPC or a specific query.
    const { data, error } = await supabase
      .from('products')
      .select('category');

    if (error) throw error;

    const categories = Array.from(new Set((data || []).map((p: any) => p.category).filter(Boolean)));

    res.json({ success: true, data: categories });
  } catch (error) {
    next(error);
  }
}
