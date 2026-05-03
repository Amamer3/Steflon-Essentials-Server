import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin as supabase } from '../config/supabase';

export async function getUserProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const { data: userData, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // User not found in 'users' table, return info from auth user
        res.json({
          success: true,
          data: {
            id: userId,
            email: req.user!.email,
            name: req.user!.name || '',
            role: req.user!.role || 'user',
          },
        });
        return;
      }
      throw error;
    }

    const { password, ...profile } = userData as any;

    res.json({ success: true, data: { id: userId, ...profile } });
  } catch (error) {
    next(error);
  }
}

export async function updateUserProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const body = req.body;

    // Only allow specific fields to be updated in the database
    // This prevents errors like "Could not find the 'currency' column"
    const updateData: any = {};
    
    if (body.name !== undefined) updateData.name = body.name;
    if (body.phone !== undefined) updateData.phone = body.phone;
    if (body.currency !== undefined) updateData.currency = body.currency;
    
    // Check if body has other fields that exist in our schema
    // Note: status, role, email, id should not be updated by the user directly here

    if (Object.keys(updateData).length === 0) {
      res.json({ success: true, message: 'No valid fields to update' });
      return;
    }

    const { data: updatedData, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;

    const { password, ...profile } = updatedData as any;

    res.json({ success: true, data: { id: userId, ...profile } });
  } catch (error) {
    next(error);
  }
}

export async function changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { newPassword } = req.body;

    if (!newPassword) {
      res.status(400).json({ success: false, error: 'New password is required' });
      return;
    }

    if (newPassword.length < 8) {
      res.status(400).json({ success: false, error: 'New password must be at least 8 characters' });
      return;
    }

    // Supabase handles password updates via the auth API
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) {
      res.status(400).json({ success: false, error: error.message });
      return;
    }

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    next(error);
  }
}
