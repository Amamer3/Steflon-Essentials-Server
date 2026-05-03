import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin as supabase } from '../config/supabase';

export async function getWishlist(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const { data: items, error } = await supabase
      .from('wishlist')
      .select('*')
      .eq('user_id', userId);

    if (error) throw error;

    const populatedItems = await Promise.all(
      (items || []).map(async (item: any) => {
        // Populate product
        if (item.product_id) {
          const { data: product } = await supabase
            .from('products')
            .select('*')
            .eq('id', item.product_id)
            .single();
          if (product) {
            item.product = product;
          }
        }
        return item;
      })
    );

    res.json({ success: true, data: populatedItems });
  } catch (error) {
    next(error);
  }
}

export async function addToWishlist(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const { productId } = req.body;

    if (!productId) {
      res.status(400).json({ success: false, error: 'Product ID is required' });
      return;
    }

    // Check if product exists
    const { data: product, error: pError } = await supabase
      .from('products')
      .select('id')
      .eq('id', productId)
      .single();

    if (pError || !product) {
      res.status(404).json({ success: false, error: 'Product not found' });
      return;
    }

    // Check if already in wishlist
    const { data: existing } = await supabase
      .from('wishlist')
      .select('id')
      .eq('user_id', userId)
      .eq('product_id', productId)
      .maybeSingle();

    if (existing) {
      res.status(400).json({ success: false, error: 'Product already in wishlist' });
      return;
    }

    // Add to wishlist
    const { data: newItem, error: iError } = await supabase
      .from('wishlist')
      .insert({
        user_id: userId,
        product_id: productId,
        // added_at is handled by DB default now()
      })
      .select()
      .single();

    if (iError) throw iError;

    res.json({ success: true, data: newItem });
  } catch (error) {
    next(error);
  }
}

export async function removeFromWishlist(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const { productId } = req.params;

    const { error } = await supabase
      .from('wishlist')
      .delete()
      .eq('user_id', userId)
      .eq('product_id', productId);

    if (error) throw error;

    res.json({ success: true, message: 'Removed from wishlist successfully' });
  } catch (error) {
    next(error);
  }
}

export async function checkWishlist(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const { productId } = req.params;

    const { data, error } = await supabase
      .from('wishlist')
      .select('id')
      .eq('user_id', userId)
      .eq('product_id', productId)
      .maybeSingle();

    if (error) throw error;

    res.json({ success: true, isInWishlist: !!data });
  } catch (error) {
    next(error);
  }
}
