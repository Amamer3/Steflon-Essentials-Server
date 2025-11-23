import { Request, Response } from 'express';
import { db } from '../config/firestore';
import { Cart, CartItem } from '../types';

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

export async function getCart(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const cartDoc = await db.collection('carts').doc(userId).get();

    if (!cartDoc.exists) {
      // Create empty cart
      const emptyCart = {
        userId,
        items: [],
        total: 0,
        updatedAt: new Date(),
      };
      await db.collection('carts').doc(userId).set(emptyCart);
      res.json({ success: true, data: { id: userId, ...emptyCart } });
      return;
    }

    const cartData = convertTimestamp(cartDoc.data());
    const cart = { id: cartDoc.id, ...cartData } as Cart;

    // Populate product details
    const itemsWithProducts = await Promise.all(
      cart.items.map(async (item: CartItem) => {
        if (item.productId) {
          const productDoc = await db.collection('products').doc(item.productId).get();
          if (productDoc.exists) {
            item.product = {
              id: productDoc.id,
              ...convertTimestamp(productDoc.data()),
            } as any;
          }
        }
        return item;
      })
    );

    cart.items = itemsWithProducts;
    res.json({ success: true, data: cart });
  } catch (error) {
    console.error('Error getting cart:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function addToCart(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const { productId, quantity = 1 } = req.body;

    if (!productId) {
      res.status(400).json({ error: 'Product ID is required' });
      return;
    }

    // Get product
    const productDoc = await db.collection('products').doc(productId).get();
    if (!productDoc.exists) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    const product = convertTimestamp(productDoc.data());
    if (product.status !== 'Active' || product.stock < quantity) {
      res.status(400).json({ error: 'Product not available' });
      return;
    }

    // Get or create cart
    const cartDoc = await db.collection('carts').doc(userId);
    const cartSnapshot = await cartDoc.get();

    let cart: Cart;
    if (!cartSnapshot.exists) {
      cart = {
        id: userId,
        userId,
        items: [],
        total: 0,
        updatedAt: new Date(),
      };
    } else {
      cart = { id: userId, ...convertTimestamp(cartSnapshot.data()) } as Cart;
    }

    // Check if item already exists
    const existingItemIndex = cart.items.findIndex((item) => item.productId === productId);
    
    if (existingItemIndex >= 0) {
      // Update quantity
      cart.items[existingItemIndex].quantity += quantity;
      cart.items[existingItemIndex].price = product.price;
    } else {
      // Add new item
      const newItem: CartItem = {
        id: `${Date.now()}-${Math.random()}`,
        productId,
        quantity,
        price: product.price,
        addedAt: new Date(),
      };
      cart.items.push(newItem);
    }

    // Calculate total
    cart.total = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    cart.updatedAt = new Date();

    await cartDoc.set(cart);
    res.json({ success: true, data: cart });
  } catch (error) {
    console.error('Error adding to cart:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function updateCartItem(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const { itemId } = req.params;
    const { quantity } = req.body;

    if (!quantity || quantity < 1) {
      res.status(400).json({ error: 'Valid quantity is required' });
      return;
    }

    const cartDoc = await db.collection('carts').doc(userId);
    const cartSnapshot = await cartDoc.get();

    if (!cartSnapshot.exists) {
      res.status(404).json({ error: 'Cart not found' });
      return;
    }

    const cart = { id: userId, ...convertTimestamp(cartSnapshot.data()) } as Cart;
    const itemIndex = cart.items.findIndex((item) => item.id === itemId);

    if (itemIndex === -1) {
      res.status(404).json({ error: 'Cart item not found' });
      return;
    }

    // Check stock
    const productDoc = await db.collection('products').doc(cart.items[itemIndex].productId).get();
    if (productDoc.exists) {
      const product = convertTimestamp(productDoc.data());
      if (product.stock < quantity) {
        res.status(400).json({ error: 'Insufficient stock' });
        return;
      }
    }

    cart.items[itemIndex].quantity = quantity;
    cart.total = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    cart.updatedAt = new Date();

    await cartDoc.set(cart);
    res.json({ success: true, data: cart });
  } catch (error) {
    console.error('Error updating cart item:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function removeCartItem(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const { itemId } = req.params;

    const cartDoc = await db.collection('carts').doc(userId);
    const cartSnapshot = await cartDoc.get();

    if (!cartSnapshot.exists) {
      res.status(404).json({ error: 'Cart not found' });
      return;
    }

    const cart = { id: userId, ...convertTimestamp(cartSnapshot.data()) } as Cart;
    cart.items = cart.items.filter((item) => item.id !== itemId);
    cart.total = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    cart.updatedAt = new Date();

    await cartDoc.set(cart);
    res.json({ success: true, data: cart });
  } catch (error) {
    console.error('Error removing cart item:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function clearCart(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const cartDoc = await db.collection('carts').doc(userId);

    const emptyCart = {
      userId,
      items: [],
      total: 0,
      updatedAt: new Date(),
    };

    await cartDoc.set(emptyCart);
    res.json({ success: true, data: { id: userId, ...emptyCart } });
  } catch (error) {
    console.error('Error clearing cart:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

