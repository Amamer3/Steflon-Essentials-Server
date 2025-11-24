import { Request, Response } from 'express';
import { db } from '../../config/firestore';

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

export async function getAdminCustomers(req: Request, res: Response): Promise<void> {
  try {
    const { page = '1', limit = '20', search, status } = req.query;
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);

    let query = db.collection('users').where('role', '==', 'user') as any;
    if (status) {
      query = query.where('status', '==', status);
    }

    const snapshot = await query.get();
    let customers = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...convertTimestamp(doc.data()),
    }));

    // Apply search filter
    if (search) {
      const searchLower = (search as string).toLowerCase();
      customers = customers.filter(
        (c: any) =>
          c.email?.toLowerCase().includes(searchLower) ||
          c.name?.toLowerCase().includes(searchLower)
      );
    }

    const total = customers.length;
    const paginatedCustomers = customers.slice((pageNum - 1) * limitNum, pageNum * limitNum);

    res.json({
      success: true,
      data: paginatedCustomers,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Error getting admin customers:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getAdminCustomerById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const userDoc = await db.collection('users').doc(id).get();

    if (!userDoc.exists) {
      res.status(404).json({ error: 'Customer not found' });
      return;
    }

    // Get order history
    const ordersSnapshot = await db
      .collection('orders')
      .where('userId', '==', id)
      .orderBy('createdAt', 'desc')
      .limit(10)
      .get();

    const orders = ordersSnapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...convertTimestamp(doc.data()),
    }));

    const customer = {
      id: userDoc.id,
      ...convertTimestamp(userDoc.data()),
      orders,
    };

    res.json({ success: true, data: customer });
  } catch (error) {
    console.error('Error getting admin customer:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function updateCustomerStatus(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['Active', 'Inactive', 'Suspended'].includes(status)) {
      res.status(400).json({ error: 'Invalid status' });
      return;
    }

    await db.collection('users').doc(id).update({
      status,
      updatedAt: new Date(),
    });

    res.json({ success: true, message: 'Customer status updated' });
  } catch (error) {
    console.error('Error updating customer status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function deleteCustomer(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    await db.collection('users').doc(id).update({
      status: 'Deleted',
      updatedAt: new Date(),
    });
    res.json({ success: true, message: 'Customer deleted' });
  } catch (error) {
    console.error('Error deleting customer:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

