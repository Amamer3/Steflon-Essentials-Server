import { Request, Response } from 'express';
import { db } from '../../config/firestore';
import { Product } from '../../types';

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

export async function getAdminProducts(req: Request, res: Response): Promise<void> {
  try {
    const { page = '1', limit = '20', category, status, search } = req.query;
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);

    let query = db.collection('products') as any;

    if (category) {
      query = query.where('category', '==', category);
    }
    if (status) {
      query = query.where('status', '==', status);
    }

    const snapshot = await query.orderBy('createdAt', 'desc').get();
    let products = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...convertTimestamp(doc.data()),
    })) as Product[];

    if (search) {
      const searchLower = (search as string).toLowerCase();
      products = products.filter(
        (p) =>
          p.name.toLowerCase().includes(searchLower) ||
          p.description?.toLowerCase().includes(searchLower) ||
          p.sku?.toLowerCase().includes(searchLower)
      );
    }

    const total = products.length;
    const paginatedProducts = products.slice((pageNum - 1) * limitNum, pageNum * limitNum);

    res.json({
      success: true,
      data: paginatedProducts,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Error getting admin products:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getAdminProductById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const doc = await db.collection('products').doc(id).get();

    if (!doc.exists) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    const product = { id: doc.id, ...convertTimestamp(doc.data()) } as Product;
    res.json({ success: true, data: product });
  } catch (error) {
    console.error('Error getting admin product:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function createProduct(req: Request, res: Response): Promise<void> {
  try {
    const productData = req.body;

    const newProduct: Omit<Product, 'id'> = {
      ...productData,
      status: productData.status || 'Active',
      featured: productData.featured || false,
      bestseller: productData.bestseller || false,
      stock: productData.stock || 0,
      images: productData.images || [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const docRef = await db.collection('products').add(newProduct);
    res.json({ success: true, data: { id: docRef.id, ...newProduct } });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function updateProduct(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const updateData = req.body;

    delete updateData.id;
    delete updateData.createdAt;

    const productDoc = await db.collection('products').doc(id);
    await productDoc.update({
      ...updateData,
      updatedAt: new Date(),
    });

    const updatedDoc = await productDoc.get();
    res.json({ success: true, data: { id: updatedDoc.id, ...convertTimestamp(updatedDoc.data()) } });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function deleteProduct(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    await db.collection('products').doc(id).delete();
    res.json({ success: true, message: 'Product deleted' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function updateProductStock(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { stock } = req.body;

    if (typeof stock !== 'number' || stock < 0) {
      res.status(400).json({ error: 'Valid stock quantity is required' });
      return;
    }

    await db.collection('products').doc(id).update({
      stock,
      updatedAt: new Date(),
    });

    res.json({ success: true, message: 'Stock updated' });
  } catch (error) {
    console.error('Error updating product stock:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function updateProductStatus(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['Active', 'Inactive', 'OutOfStock'].includes(status)) {
      res.status(400).json({ error: 'Invalid status' });
      return;
    }

    await db.collection('products').doc(id).update({
      status,
      updatedAt: new Date(),
    });

    res.json({ success: true, message: 'Status updated' });
  } catch (error) {
    console.error('Error updating product status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

