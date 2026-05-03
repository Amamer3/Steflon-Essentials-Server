import { Request, Response } from 'express';
import { supabaseAdmin as supabase } from '../../config/supabase';

export async function getAdminProfile(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const { data: userData, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !userData) {
      res.status(404).json({ success: false, error: 'Admin not found' });
      return;
    }

    const { password, ...profile } = userData as any;

    res.json({ success: true, data: { id: userId, ...profile } });
  } catch (error) {
    console.error('Error getting admin profile:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

export async function updateAdminProfile(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const updateData = req.body;

    delete updateData.id;
    delete updateData.email;
    delete updateData.role;
    delete updateData.password;

    const { data: updatedData, error } = await supabase
      .from('users')
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;

    const { password, ...profile } = updatedData as any;

    res.json({ success: true, data: { id: userId, ...profile } });
  } catch (error) {
    console.error('Error updating admin profile:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

export async function changeAdminPassword(req: Request, res: Response): Promise<void> {
  try {
    const { newPassword } = req.body;

    if (!newPassword) {
      res.status(400).json({ success: false, error: 'New password is required' });
      return;
    }

    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) {
      res.status(400).json({ success: false, error: error.message });
      return;
    }

    res.json({
      success: true,
      message: 'Password updated successfully',
    });
  } catch (error) {
    console.error('Error changing admin password:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
}
