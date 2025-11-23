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

function getDateRange(timeRange: string): { start: Date; end: Date } {
  const end = new Date();
  let start = new Date();

  switch (timeRange) {
    case '7days':
      start.setDate(end.getDate() - 7);
      break;
    case '30days':
      start.setDate(end.getDate() - 30);
      break;
    case '90days':
      start.setDate(end.getDate() - 90);
      break;
    case '1year':
      start.setFullYear(end.getFullYear() - 1);
      break;
    case 'all':
    default:
      start = new Date(0); // Beginning of time
      break;
  }

  return { start, end };
}

export async function getDashboardStats(req: Request, res: Response): Promise<void> {
  try {
    const { timeRange = '30days' } = req.query;
    const { start, end } = getDateRange(timeRange as string);

    // Get orders in date range
    const ordersSnapshot = await db
      .collection('orders')
      .where('createdAt', '>=', start)
      .where('createdAt', '<=', end)
      .get();

    const orders = ordersSnapshot.docs.map((doc: any) => convertTimestamp(doc.data()));

    // Calculate stats
    const totalRevenue = orders.reduce((sum: number, order: any) => sum + (order.total || 0), 0);
    const totalOrders = orders.length;
    const totalCustomers = new Set(orders.map((o: any) => o.userId)).size;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Get product count
    const productsSnapshot = await db.collection('products').where('status', '==', 'Active').get();
    const totalProducts = productsSnapshot.size;

    res.json({
      success: true,
      data: {
        totalRevenue,
        totalOrders,
        totalCustomers,
        totalProducts,
        averageOrderValue,
        timeRange,
      },
    });
  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getRevenueAnalytics(req: Request, res: Response): Promise<void> {
  try {
    const { timeRange = '30days', groupBy = 'day' } = req.query;
    const { start, end } = getDateRange(timeRange as string);

    const ordersSnapshot = await db
      .collection('orders')
      .where('createdAt', '>=', start)
      .where('createdAt', '<=', end)
      .get();

    const orders = ordersSnapshot.docs.map((doc: any) => convertTimestamp(doc.data()));

    // Group by time period
    const revenueByPeriod: Record<string, number> = {};
    orders.forEach((order: any) => {
      const date = new Date(order.createdAt);
      let key: string;

      if (groupBy === 'day') {
        key = date.toISOString().split('T')[0];
      } else if (groupBy === 'week') {
        const week = Math.ceil(date.getDate() / 7);
        key = `${date.getFullYear()}-W${week}`;
      } else {
        key = `${date.getFullYear()}-${date.getMonth() + 1}`;
      }

      revenueByPeriod[key] = (revenueByPeriod[key] || 0) + order.total;
    });

    res.json({
      success: true,
      data: {
        revenueByPeriod,
        totalRevenue: Object.values(revenueByPeriod).reduce((a, b) => a + b, 0),
        timeRange,
        groupBy,
      },
    });
  } catch (error) {
    console.error('Error getting revenue analytics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getOrderAnalytics(req: Request, res: Response): Promise<void> {
  try {
    const { timeRange = '30days' } = req.query;
    const { start, end } = getDateRange(timeRange as string);

    const ordersSnapshot = await db
      .collection('orders')
      .where('createdAt', '>=', start)
      .where('createdAt', '<=', end)
      .get();

    const orders = ordersSnapshot.docs.map((doc: any) => convertTimestamp(doc.data()));

    // Count by status
    const statusCounts: Record<string, number> = {};
    orders.forEach((order: any) => {
      statusCounts[order.status] = (statusCounts[order.status] || 0) + 1;
    });

    res.json({
      success: true,
      data: {
        totalOrders: orders.length,
        statusCounts,
        timeRange,
      },
    });
  } catch (error) {
    console.error('Error getting order analytics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getProductAnalytics(req: Request, res: Response): Promise<void> {
  try {
    const { limit = '10' } = req.query;
    const limitNum = parseInt(limit as string, 10);

    // Get all orders to calculate product performance
    const ordersSnapshot = await db.collection('orders').get();
    const orders = ordersSnapshot.docs.map((doc: any) => convertTimestamp(doc.data()));

    // Calculate product sales
    const productSales: Record<string, { name: string; quantity: number; revenue: number }> = {};
    orders.forEach((order: any) => {
      order.items?.forEach((item: any) => {
        if (!productSales[item.productId]) {
          productSales[item.productId] = {
            name: item.name,
            quantity: 0,
            revenue: 0,
          };
        }
        productSales[item.productId].quantity += item.quantity;
        productSales[item.productId].revenue += item.total;
      });
    });

    // Sort by revenue and get top products
    const topProducts = Object.entries(productSales)
      .map(([productId, data]) => ({ productId, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, limitNum);

    res.json({
      success: true,
      data: topProducts,
    });
  } catch (error) {
    console.error('Error getting product analytics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getCustomerAnalytics(_req: Request, res: Response): Promise<void> {
  try {
    const usersSnapshot = await db.collection('users').where('role', '==', 'user').get();
    const totalCustomers = usersSnapshot.size;

    const ordersSnapshot = await db.collection('orders').get();
    const orders = ordersSnapshot.docs.map((doc: any) => convertTimestamp(doc.data()));

    // Calculate customer metrics
    const customerOrders: Record<string, number> = {};
    const customerRevenue: Record<string, number> = {};

    orders.forEach((order: any) => {
      customerOrders[order.userId] = (customerOrders[order.userId] || 0) + 1;
      customerRevenue[order.userId] = (customerRevenue[order.userId] || 0) + order.total;
    });

    const activeCustomers = Object.keys(customerOrders).length;
    const averageOrdersPerCustomer = activeCustomers > 0 ? orders.length / activeCustomers : 0;
    const averageRevenuePerCustomer =
      activeCustomers > 0
        ? Object.values(customerRevenue).reduce((a, b) => a + b, 0) / activeCustomers
        : 0;

    res.json({
      success: true,
      data: {
        totalCustomers,
        activeCustomers,
        averageOrdersPerCustomer,
        averageRevenuePerCustomer,
      },
    });
  } catch (error) {
    console.error('Error getting customer analytics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

