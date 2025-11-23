import { Request, Response } from 'express';
import { db } from '../../config/firestore';
import { Order } from '../../types';

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

export async function getAdminOrders(req: Request, res: Response): Promise<void> {
  try {
    const { page = '1', limit = '20', status, search, dateFrom, dateTo } = req.query;
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);

    let query = db.collection('orders') as any;

    if (status) {
      query = query.where('status', '==', status);
    }

    const snapshot = await query.orderBy('createdAt', 'desc').get();
    let orders = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...convertTimestamp(doc.data()),
    })) as Order[];

    // Apply filters
    if (search) {
      const searchLower = (search as string).toLowerCase();
      orders = orders.filter(
        (o) =>
          o.orderNumber.toLowerCase().includes(searchLower) ||
          o.userId.toLowerCase().includes(searchLower)
      );
    }

    if (dateFrom || dateTo) {
      const fromDate = dateFrom ? new Date(dateFrom as string) : null;
      const toDate = dateTo ? new Date(dateTo as string) : null;
      orders = orders.filter((o) => {
        const orderDate = o.createdAt;
        if (fromDate && orderDate < fromDate) return false;
        if (toDate && orderDate > toDate) return false;
        return true;
      });
    }

    const total = orders.length;
    const paginatedOrders = orders.slice((pageNum - 1) * limitNum, pageNum * limitNum);

    res.json({
      success: true,
      data: paginatedOrders,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Error getting admin orders:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getAdminOrderById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const doc = await db.collection('orders').doc(id).get();

    if (!doc.exists) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    const order = { id: doc.id, ...convertTimestamp(doc.data()) } as Order;
    res.json({ success: true, data: order });
  } catch (error) {
    console.error('Error getting admin order:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function updateOrderStatus(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Refunded'];
    if (!validStatuses.includes(status)) {
      res.status(400).json({ error: 'Invalid status' });
      return;
    }

    await db.collection('orders').doc(id).update({
      status,
      updatedAt: new Date(),
    });

    res.json({ success: true, message: 'Order status updated' });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function exportOrders(req: Request, res: Response): Promise<void> {
  try {
    const { format = 'csv', status, dateFrom, dateTo } = req.query;

    let query = db.collection('orders') as any;
    if (status) {
      query = query.where('status', '==', status);
    }

    const snapshot = await query.orderBy('createdAt', 'desc').get();
    let orders = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...convertTimestamp(doc.data()),
    })) as Order[];

    // Apply date filters
    if (dateFrom || dateTo) {
      const fromDate = dateFrom ? new Date(dateFrom as string) : null;
      const toDate = dateTo ? new Date(dateTo as string) : null;
      orders = orders.filter((o) => {
        const orderDate = o.createdAt;
        if (fromDate && orderDate < fromDate) return false;
        if (toDate && orderDate > toDate) return false;
        return true;
      });
    }

    // TODO: Implement actual CSV/Excel export
    // For now, return JSON
    res.json({
      success: true,
      message: 'Export functionality to be implemented',
      data: orders,
      format,
    });
  } catch (error) {
    console.error('Error exporting orders:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

