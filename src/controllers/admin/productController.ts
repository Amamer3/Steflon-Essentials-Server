import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin as supabase } from '../../config/supabase';

export async function getAdminProducts(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { page = '1', limit = '20', category, status, search } = req.query;
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const from = (pageNum - 1) * limitNum;
    const to = from + limitNum - 1;

    let query = supabase.from('products').select('*', { count: 'exact' });

    if (category) {
      query = query.eq('category', category);
    }
    if (status) {
      query = query.eq('status', status);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%,sku.ilike.%${search}%`);
    }

    query = query.order('created_at', { ascending: false });
    query = query.range(from, to);

    const { data: products, error, count } = await query;

    if (error) throw error;

    res.json({
      success: true,
      data: products,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getAdminProductById(req: Request, res: Response, next: NextFunction): Promise<void> {
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

export async function createProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const productData = req.body;

    const newProduct = {
      ...productData,
      status: productData.status || 'Active',
      featured: productData.featured || false,
      bestseller: productData.bestseller || false,
      stock: productData.stock || 0,
      images: productData.images || [],
      // created_at and updated_at are handled by the database triggers
    };

    // Remove camelCase versions if they exist to avoid DB errors
    delete newProduct.createdAt;
    delete newProduct.updatedAt;

    const { data: product, error } = await supabase
      .from('products')
      .insert(newProduct)
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
}

export async function updateProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const productData = req.body;

    // Remove camelCase versions if they exist
    delete productData.createdAt;
    delete productData.updatedAt;

    const { data: product, error } = await supabase
      .from('products')
      .update(productData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
}

export async function deleteProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    next(error);
  }
}

export async function updateProductStock(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const { stock } = req.body;
    const { data: product, error } = await supabase
      .from('products')
      .update({ stock })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    res.json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
}

export async function updateProductStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const { data: product, error } = await supabase
      .from('products')
      .update({ status })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    res.json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
}
