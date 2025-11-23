import { Request, Response } from 'express';
import { db } from '../config/firestore';
import { Order, OrderItem } from '../types';

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

function generateOrderNumber(): string {
  return `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
}

export async function createOrder(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const { shippingAddressId, billingAddressId, paymentMethod } = req.body;

    // Get cart
    const cartDoc = await db.collection('carts').doc(userId).get();
    if (!cartDoc.exists) {
      res.status(404).json({ error: 'Cart not found' });
      return;
    }

    const cart = convertTimestamp(cartDoc.data());
    if (!cart.items || cart.items.length === 0) {
      res.status(400).json({ error: 'Cart is empty' });
      return;
    }

    // Get addresses
    const shippingAddressDoc = await db.collection('addresses').doc(shippingAddressId).get();
    if (!shippingAddressDoc.exists) {
      res.status(404).json({ error: 'Shipping address not found' });
      return;
    }

    let billingAddress = null;
    if (billingAddressId) {
      const billingAddressDoc = await db.collection('addresses').doc(billingAddressId).get();
      if (billingAddressDoc.exists) {
        billingAddress = convertTimestamp(billingAddressDoc.data());
      }
    }

    // Build order items and verify stock
    const orderItems: OrderItem[] = [];
    for (const cartItem of cart.items) {
      const productDoc = await db.collection('products').doc(cartItem.productId).get();
      if (!productDoc.exists) {
        res.status(404).json({ error: `Product ${cartItem.productId} not found` });
        return;
      }

      const product = convertTimestamp(productDoc.data());
      if (product.stock < cartItem.quantity) {
        res.status(400).json({ error: `Insufficient stock for ${product.name}` });
        return;
      }

      orderItems.push({
        productId: cartItem.productId,
        name: product.name,
        price: cartItem.price,
        quantity: cartItem.quantity,
        total: cartItem.price * cartItem.quantity,
      });
    }

    // Calculate totals
    const subtotal = orderItems.reduce((sum, item) => sum + item.total, 0);
    const shipping = 10; // Fixed shipping for now
    const tax = subtotal * 0.1; // 10% tax
    const total = subtotal + shipping + tax;

    // Create order
    const order: Omit<Order, 'id'> = {
      orderNumber: generateOrderNumber(),
      userId,
      items: orderItems,
      subtotal,
      shipping,
      tax,
      total,
      status: 'Pending',
      shippingAddress: convertTimestamp(shippingAddressDoc.data()),
      billingAddress: billingAddress ? convertTimestamp(billingAddress) : undefined,
      paymentMethod: paymentMethod || 'Credit Card',
      paymentStatus: 'Pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const orderRef = await db.collection('orders').add(order);

    // Update product stock
    const batch = db.batch();
    for (const item of orderItems) {
      const productRef = db.collection('products').doc(item.productId);
      const productDoc = await productRef.get();
      if (productDoc.exists) {
        const product = convertTimestamp(productDoc.data());
        batch.update(productRef, { stock: product.stock - item.quantity });
      }
    }
    await batch.commit();

    // Clear cart
    await db.collection('carts').doc(userId).set({
      userId,
      items: [],
      total: 0,
      updatedAt: new Date(),
    });

    res.json({ success: true, data: { id: orderRef.id, ...order } });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getOrders(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const { page = '1', limit = '10', status } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);

    let query = db.collection('orders').where('userId', '==', userId) as any;

    if (status) {
      query = query.where('status', '==', status);
    }

    const snapshot = await query.orderBy('createdAt', 'desc').get();
    const total = snapshot.size;

    const orders = snapshot.docs
      .slice((pageNum - 1) * limitNum, pageNum * limitNum)
      .map((doc: any) => ({
        id: doc.id,
        ...convertTimestamp(doc.data()),
      })) as Order[];

    res.json({
      success: true,
      data: orders,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Error getting orders:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getOrderById(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const orderDoc = await db.collection('orders').doc(id).get();
    if (!orderDoc.exists) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    const order = convertTimestamp(orderDoc.data());
    if (order.userId !== userId) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    res.json({ success: true, data: { id: orderDoc.id, ...order } });
  } catch (error) {
    console.error('Error getting order:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function cancelOrder(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const orderDoc = await db.collection('orders').doc(id);
    const orderSnapshot = await orderDoc.get();

    if (!orderSnapshot.exists) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    const order = convertTimestamp(orderSnapshot.data());
    if (order.userId !== userId) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    if (order.status === 'Cancelled' || order.status === 'Delivered') {
      res.status(400).json({ error: 'Order cannot be cancelled' });
      return;
    }

    // Restore stock
    const batch = db.batch();
    for (const item of order.items) {
      const productRef = db.collection('products').doc(item.productId);
      const productDoc = await productRef.get();
      if (productDoc.exists) {
        const product = convertTimestamp(productDoc.data());
        batch.update(productRef, { stock: product.stock + item.quantity });
      }
    }
    await batch.commit();

    // Update order status
    await orderDoc.update({
      status: 'Cancelled',
      updatedAt: new Date(),
    });

    res.json({ success: true, message: 'Order cancelled' });
  } catch (error) {
    console.error('Error cancelling order:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function reorderItems(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const orderDoc = await db.collection('orders').doc(id).get();
    if (!orderDoc.exists) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    const order = convertTimestamp(orderDoc.data());
    if (order.userId !== userId) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    // Add items to cart
    const cartDoc = await db.collection('carts').doc(userId);
    const cartSnapshot = await cartDoc.get();

    let cart: any;
    if (!cartSnapshot.exists) {
      cart = { userId, items: [], total: 0, updatedAt: new Date() };
    } else {
      cart = convertTimestamp(cartSnapshot.data());
    }

    // Add order items to cart
    for (const orderItem of order.items) {
      const existingIndex = cart.items.findIndex(
        (item: any) => item.productId === orderItem.productId
      );

      if (existingIndex >= 0) {
        cart.items[existingIndex].quantity += orderItem.quantity;
      } else {
        cart.items.push({
          id: `${Date.now()}-${Math.random()}`,
          productId: orderItem.productId,
          quantity: orderItem.quantity,
          price: orderItem.price,
          addedAt: new Date(),
        });
      }
    }

    cart.total = cart.items.reduce((sum: number, item: any) => sum + item.price * item.quantity, 0);
    cart.updatedAt = new Date();

    await cartDoc.set(cart);
    res.json({ success: true, data: cart });
  } catch (error) {
    console.error('Error reordering items:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

