import { Request, Response } from 'express';
import { supabaseAdmin as supabase } from '../config/supabase';

export async function getAddresses(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const { data: addresses, error } = await supabase
      .from('addresses')
      .select('*')
      .eq('user_id', userId);

    if (error) throw error;

    res.json({ success: true, data: addresses });
  } catch (error) {
    console.error('Error getting addresses:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

export async function addAddress(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const {
      firstName,
      lastName,
      phone,
      addressLine1,
      addressLine2,
      city,
      state,
      zipCode,
      country,
      type,
      isDefault
    } = req.body;

    // If this is set as default, unset other defaults
    if (isDefault) {
      await supabase
        .from('addresses')
        .update({ is_default: false })
        .eq('user_id', userId)
        .eq('is_default', true);
    }

    const newAddress = {
      user_id: userId,
      first_name: firstName,
      last_name: lastName,
      phone,
      address_line1: addressLine1,
      address_line2: addressLine2,
      city,
      state,
      zip_code: zipCode,
      country,
      type: type || 'shipping',
      is_default: isDefault || false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: address, error } = await supabase
      .from('addresses')
      .insert(newAddress)
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, data: address });
  } catch (error) {
    console.error('Error adding address:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

export async function updateAddress(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const {
      firstName,
      lastName,
      phone,
      addressLine1,
      addressLine2,
      city,
      state,
      zipCode,
      country,
      type,
      isDefault
    } = req.body;

    const { data: existingAddress, error: fetchError } = await supabase
      .from('addresses')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existingAddress) {
      res.status(404).json({ success: false, error: 'Address not found' });
      return;
    }

    if (existingAddress.user_id !== userId) {
      res.status(403).json({ success: false, error: 'Forbidden' });
      return;
    }

    // If setting as default, unset other defaults
    if (isDefault) {
      await supabase
        .from('addresses')
        .update({ is_default: false })
        .eq('user_id', userId)
        .eq('is_default', true)
        .neq('id', id);
    }

    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (firstName) updateData.first_name = firstName;
    if (lastName) updateData.last_name = lastName;
    if (phone !== undefined) updateData.phone = phone;
    if (addressLine1) updateData.address_line1 = addressLine1;
    if (addressLine2 !== undefined) updateData.address_line2 = addressLine2;
    if (city) updateData.city = city;
    if (state) updateData.state = state;
    if (zipCode) updateData.zip_code = zipCode;
    if (country) updateData.country = country;
    if (type) updateData.type = type;
    if (isDefault !== undefined) updateData.is_default = isDefault;

    const { data: updatedAddress, error: updateError } = await supabase
      .from('addresses')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

    res.json({ success: true, data: updatedAddress });
  } catch (error) {
    console.error('Error updating address:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

export async function deleteAddress(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const { data: existingAddress, error: fetchError } = await supabase
      .from('addresses')
      .select('user_id')
      .eq('id', id)
      .single();

    if (fetchError || !existingAddress) {
      res.status(404).json({ success: false, error: 'Address not found' });
      return;
    }

    if (existingAddress.user_id !== userId) {
      res.status(403).json({ success: false, error: 'Forbidden' });
      return;
    }

    const { error } = await supabase
      .from('addresses')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({ success: true, message: 'Address deleted successfully' });
  } catch (error) {
    console.error('Error deleting address:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

export async function setDefaultAddress(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    // Unset current default
    await supabase
      .from('addresses')
      .update({ is_default: false })
      .eq('user_id', userId)
      .eq('is_default', true);

    // Set new default
    const { data: address, error } = await supabase
      .from('addresses')
      .update({ is_default: true, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, data: address });
  } catch (error) {
    console.error('Error setting default address:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
}
