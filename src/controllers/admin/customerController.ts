import { Request, Response } from 'express';
import { supabaseAdmin as supabase } from '../../config/supabase';

export async function getAdminCustomers(req: Request, res: Response): Promise<void> {
  try {
    const { page = '1', limit = '20', search, status } = req.query;
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const from = (pageNum - 1) * limitNum;
    const to = from + limitNum - 1;

    let query = supabase.from('users').select('*', { count: 'exact' }).eq('role', 'user');
    
    if (status) {
      query = query.eq('status', status);
    }

    if (search) {
      query = query.or(`email.ilike.%${search}%,name.ilike.%${search}%`);
    }

    query = query.order('created_at', { ascending: false });
    query = query.range(from, to);

    const { data: customers, error, count } = await query;

    if (error) throw error;

    res.json({
      success: true,
      data: customers,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limitNum),
      },
    });
  } catch (error) {
    console.error('Error getting admin customers:', error);
    res.status(500).json({ 
      success: false, 
      error: { message: 'Internal server error' },
      message: 'Internal server error'
    });
  }
}

export async function getAdminCustomerById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    
    const { data: customer, error: uError } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (uError || !customer) {
      res.status(404).json({ 
        success: false, 
        error: { message: 'Customer not found' },
        message: 'Customer not found'
      });
      return;
    }

    // Get order history
    const { data: orders } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', id)
      .order('created_at', { ascending: false })
      .limit(10);

    res.json({
      success: true,
      data: {
        ...customer,
        orders: orders || [],
      },
    });
  } catch (error) {
    console.error('Error getting admin customer:', error);
    res.status(500).json({ 
      success: false, 
      error: { message: 'Internal server error' },
      message: 'Internal server error'
    });
  }
}

export async function updateCustomerStatus(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const { data: customer, error } = await supabase
      .from('users')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, data: customer });
  } catch (error) {
    console.error('Error updating customer status:', error);
    res.status(500).json({ 
      success: false, 
      error: { message: 'Internal server error' },
      message: 'Internal server error'
    });
  }
}

export async function deleteCustomer(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({ success: true, message: 'Customer deleted successfully' });
  } catch (error) {
    console.error('Error deleting customer:', error);
    res.status(500).json({ 
      success: false, 
      error: { message: 'Internal server error' },
      message: 'Internal server error'
    });
  }
}
