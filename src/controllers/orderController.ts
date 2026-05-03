import { Request, Response } from 'express';
import { supabaseAdmin as supabase } from '../config/supabase';
import { OrderItem } from '../types';

function generateOrderNumber(): string {
  return `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
}

export async function createOrder(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const { shippingAddressId, billingAddressId, paymentMethod } = req.body;

    // Get cart
    const { data: cart, error: cartError } = await supabase
      .from('carts')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (cartError || !cart || !cart.items || cart.items.length === 0) {
      res.status(400).json({ success: false, error: 'Cart is empty or not found' });
      return;
    }

    // Get addresses
    const { data: shippingAddress, error: sAddrError } = await supabase
      .from('addresses')
      .select('*')
      .eq('id', shippingAddressId)
      .single();

    if (sAddrError || !shippingAddress) {
      res.status(404).json({ success: false, error: 'Shipping address not found' });
      return;
    }

    let billingAddress = null;
    if (billingAddressId) {
      const { data: bAddr } = await supabase
        .from('addresses')
        .select('*')
        .eq('id', billingAddressId)
        .single();
      billingAddress = bAddr;
    }

    // Build order items and verify stock
    const orderItems: OrderItem[] = [];
    for (const cartItem of cart.items) {
      const { data: product, error: pError } = await supabase
        .from('products')
        .select('*')
        .eq('id', cartItem.productId)
        .single();

      if (pError || !product) {
        res.status(404).json({ success: false, error: `Product ${cartItem.productId} not found` });
        return;
      }

      if (product.stock < cartItem.quantity) {
        res.status(400).json({ success: false, error: `Insufficient stock for ${product.name}` });
        return;
      }

      // In a real app, you'd use the current price from the product table
      const price = product.price;

      orderItems.push({
        productId: cartItem.productId,
        name: product.name,
        price: price,
        quantity: cartItem.quantity,
        total: price * cartItem.quantity,
      });
    }

    // Calculate totals
    const subtotal = orderItems.reduce((sum, item) => sum + item.total, 0);
    const shipping = 10; // Fixed shipping for now
    const tax = subtotal * 0.1; // 10% tax
    const total = subtotal + shipping + tax;

    // Create order
    const orderData: any = {
      order_number: generateOrderNumber(),
      user_id: userId,
      items: orderItems,
      subtotal,
      shipping,
      tax,
      total,
      status: 'Pending',
      shipping_address: shippingAddress,
      billing_address: billingAddress || shippingAddress,
      payment_method: paymentMethod || 'Credit Card',
      payment_status: 'Pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert(orderData)
      .select()
      .single();

    if (orderError) throw orderError;

    // Update product stock and clear cart
    try {
      for (const item of orderItems) {
        const { error: stockError } = await supabase.rpc('decrement_stock', {
          product_id: item.productId,
          quantity: item.quantity,
        });

        if (stockError) {
          console.error(`Failed to decrement stock for product ${item.productId}:`, stockError);
          // In a production app, you might want to rollback the order here if stock deduction fails
        }
      }
    } catch (stockError) {
      console.error('Error in stock deduction loop:', stockError);
    }

    await supabase
      .from('carts')
      .update({ items: [], total: 0, updated_at: new Date().toISOString() })
      .eq('user_id', userId);

    res.status(201).json({ success: true, data: order });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

export async function getMyOrders(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const { data: orders, error } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ success: true, data: orders });
  } catch (error) {
    console.error('Error getting orders:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

export async function getOrderById(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const { data: order, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error || !order) {
      res.status(404).json({ success: false, error: 'Order not found' });
      return;
    }

    res.json({ success: true, data: order });
  } catch (error) {
    console.error('Error getting order:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

export async function getOrders(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const { data: orders, error } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ success: true, data: orders });
  } catch (error) {
    console.error('Error getting user orders:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

export async function cancelOrder(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    // First get the order to know which items to restore
    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (fetchError || !order) {
      res.status(404).json({ success: false, error: 'Order not found' });
      return;
    }

    if (order.status === 'Cancelled') {
      res.status(400).json({ success: false, error: 'Order is already cancelled' });
      return;
    }

    const { data: updatedOrder, error } = await supabase
      .from('orders')
      .update({ status: 'Cancelled', updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;

    // Restore stock
    try {
      for (const item of order.items) {
        await supabase.rpc('increment_stock', {
          product_id: item.productId,
          quantity: item.quantity,
        });
      }
    } catch (restoreError) {
      console.error('Error restoring stock for cancelled order:', restoreError);
    }

    res.json({ success: true, data: updatedOrder });
  } catch (error) {
    console.error('Error cancelling order:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

export async function reorderItems(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const { data: order, error } = await supabase
      .from('orders')
      .select('items')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error || !order) {
      res.status(404).json({ success: false, error: 'Order not found' });
      return;
    }

    // Add items back to cart
    const { data: cart } = await supabase
      .from('carts')
      .select('items')
      .eq('user_id', userId)
      .single();

    const currentItems = cart?.items || [];
    const newItems = [...currentItems];

    for (const item of order.items) {
      const existing = newItems.find((i: any) => i.productId === item.productId);
      if (existing) {
        existing.quantity += item.quantity;
      } else {
        newItems.push({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price
        });
      }
    }

    const { error: uError } = await supabase
      .from('carts')
      .update({ items: newItems, updated_at: new Date().toISOString() })
      .eq('user_id', userId);

    if (uError) throw uError;

    res.json({ success: true, message: 'Items added to cart' });
  } catch (error) {
    console.error('Error reordering items:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
}
