import { Request, Response } from 'express';
import { supabaseAdmin as supabase } from '../config/supabase';
import { CartItem } from '../types';

export async function getCart(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    
    // Get cart
    let { data: cart, error } = await supabase
      .from('carts')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code === 'PGRST116') {
      // Cart not found, create empty cart
      const emptyCart = {
        user_id: userId,
        items: [],
        total: 0,
        updated_at: new Date().toISOString(),
      };
      
      const { data: newCart, error: createError } = await supabase
        .from('carts')
        .insert(emptyCart)
        .select()
        .single();
        
      if (createError) throw createError;
      cart = newCart;
    } else if (error) {
      throw error;
    }

    // Populate product details
    if (cart && cart.items && cart.items.length > 0) {
      const itemsWithProducts = await Promise.all(
        cart.items.map(async (item: CartItem) => {
          if (item.productId) {
            const { data: product, error: pError } = await supabase
              .from('products')
              .select('*')
              .eq('id', item.productId)
              .single();
              
            if (!pError && product) {
              item.product = product as any;
            }
          }
          return item;
        })
      );
      cart.items = itemsWithProducts;
    }

    res.json({ success: true, data: cart });
  } catch (error) {
    console.error('Error getting cart:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

export async function addToCart(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const { productId, quantity = 1 } = req.body;

    if (!productId) {
      res.status(400).json({ success: false, error: 'Product ID is required' });
      return;
    }

    // Get product
    const { data: product, error: pError } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();

    if (pError || !product) {
      res.status(404).json({ success: false, error: 'Product not found' });
      return;
    }

    if (product.status !== 'Active' || product.stock < quantity) {
      res.status(400).json({ success: false, error: 'Product not available' });
      return;
    }

    // Get cart
    let { data: cart, error: cError } = await supabase
      .from('carts')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (cError && cError.code === 'PGRST116') {
      cart = {
        user_id: userId,
        items: [],
        total: 0,
        updated_at: new Date().toISOString(),
      };
    } else if (cError) {
      throw cError;
    }

    // Update items
    const items = [...(cart.items || [])];
    const itemIndex = items.findIndex((i: any) => i.productId === productId);

    if (itemIndex > -1) {
      items[itemIndex].quantity += quantity;
    } else {
      items.push({ productId, quantity });
    }

    // Calculate total
    // Note: In a real app, you'd fetch all product prices to calculate total
    // For now, let's just update the cart
    const { data: updatedCart, error: uError } = await supabase
      .from('carts')
      .upsert({
        user_id: userId,
        items,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' })
      .select()
      .single();

    if (uError) throw uError;

    res.json({ success: true, data: updatedCart });
  } catch (error) {
    console.error('Error adding to cart:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

export async function updateCartItem(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const { productId, quantity } = req.body;

    if (!productId || quantity === undefined) {
      res.status(400).json({ success: false, error: 'Product ID and quantity are required' });
      return;
    }

    const { data: cart, error: cError } = await supabase
      .from('carts')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (cError || !cart) {
      res.status(404).json({ success: false, error: 'Cart not found' });
      return;
    }

    let items = [...(cart.items || [])];
    if (quantity <= 0) {
      items = items.filter((i: any) => i.productId !== productId);
    } else {
      const itemIndex = items.findIndex((i: any) => i.productId === productId);
      if (itemIndex > -1) {
        items[itemIndex].quantity = quantity;
      }
    }

    const { data: updatedCart, error: uError } = await supabase
      .from('carts')
      .update({
        items,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (uError) throw uError;

    res.json({ success: true, data: updatedCart });
  } catch (error) {
    console.error('Error updating cart item:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

export async function removeFromCart(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const { productId } = req.params;

    const { data: cart, error: cError } = await supabase
      .from('carts')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (cError || !cart) {
      res.status(404).json({ success: false, error: 'Cart not found' });
      return;
    }

    const items = cart.items.filter((i: any) => i.productId !== productId);

    const { data: updatedCart, error: uError } = await supabase
      .from('carts')
      .update({
        items,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (uError) throw uError;

    res.json({ success: true, data: updatedCart });
  } catch (error) {
    console.error('Error removing from cart:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

export async function clearCart(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;

    const { error } = await supabase
      .from('carts')
      .update({
        items: [],
        total: 0,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    if (error) throw error;

    res.json({ success: true, message: 'Cart cleared successfully' });
  } catch (error) {
    console.error('Error clearing cart:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

export async function removeCartItem(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const { itemId } = req.params;

    const { data: cart, error: cError } = await supabase
      .from('carts')
      .select('*')
      .eq('userId', userId)
      .single();

    if (cError || !cart) {
      res.status(404).json({ success: false, error: 'Cart not found' });
      return;
    }

    const items = cart.items.filter((i: any) => i.productId !== itemId);

    const { data: updatedCart, error: uError } = await supabase
      .from('carts')
      .update({
        items,
        updatedAt: new Date().toISOString(),
      })
      .eq('userId', userId)
      .select()
      .single();

    if (uError) throw uError;

    res.json({ success: true, data: updatedCart });
  } catch (error) {
    console.error('Error removing cart item:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
}
