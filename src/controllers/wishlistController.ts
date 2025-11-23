import { Request, Response } from 'express';
import { db } from '../config/firestore';
import { WishlistItem } from '../types';

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

export async function getWishlist(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const snapshot = await db.collection('wishlist').where('userId', '==', userId).get();

    const items = await Promise.all(
      snapshot.docs.map(async (doc: any) => {
        const itemData = convertTimestamp(doc.data());
        const item: WishlistItem = {
          id: doc.id,
          ...itemData,
        } as WishlistItem;

        // Populate product
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

    res.json({ success: true, data: items });
  } catch (error) {
    console.error('Error getting wishlist:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function addToWishlist(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const { productId } = req.body;

    if (!productId) {
      res.status(400).json({ error: 'Product ID is required' });
      return;
    }

    // Check if product exists
    const productDoc = await db.collection('products').doc(productId).get();
    if (!productDoc.exists) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    // Check if already in wishlist
    const existingSnapshot = await db
      .collection('wishlist')
      .where('userId', '==', userId)
      .where('productId', '==', productId)
      .limit(1)
      .get();

    if (!existingSnapshot.empty) {
      res.status(400).json({ error: 'Product already in wishlist' });
      return;
    }

    // Add to wishlist
    const wishlistItem: Omit<WishlistItem, 'id'> = {
      userId,
      productId,
      addedAt: new Date(),
    };

    const docRef = await db.collection('wishlist').add(wishlistItem);
    const newItem = { id: docRef.id, ...wishlistItem } as WishlistItem;

    res.json({ success: true, data: newItem });
  } catch (error) {
    console.error('Error adding to wishlist:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function removeFromWishlist(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const { productId } = req.params;

    const snapshot = await db
      .collection('wishlist')
      .where('userId', '==', userId)
      .where('productId', '==', productId)
      .limit(1)
      .get();

    if (snapshot.empty) {
      res.status(404).json({ error: 'Wishlist item not found' });
      return;
    }

    await snapshot.docs[0].ref.delete();
    res.json({ success: true, message: 'Item removed from wishlist' });
  } catch (error) {
    console.error('Error removing from wishlist:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function checkWishlist(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const { productId } = req.params;

    const snapshot = await db
      .collection('wishlist')
      .where('userId', '==', userId)
      .where('productId', '==', productId)
      .limit(1)
      .get();

    res.json({ success: true, data: { inWishlist: !snapshot.empty } });
  } catch (error) {
    console.error('Error checking wishlist:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

