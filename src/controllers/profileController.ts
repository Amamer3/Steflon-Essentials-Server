import { Request, Response } from 'express';
import { db } from '../config/firestore';

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

export async function getUserProfile(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const userDoc = await db.collection('users').doc(userId).get();

    if (!userDoc.exists) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const userData = convertTimestamp(userDoc.data());
    const { password, ...profile } = userData as any;

    res.json({ success: true, data: { id: userDoc.id, ...profile } });
  } catch (error) {
    console.error('Error getting user profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function updateUserProfile(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const updateData = req.body;

    // Remove fields that shouldn't be updated directly
    delete updateData.id;
    delete updateData.email;
    delete updateData.role;
    delete updateData.password;

    const userDoc = await db.collection('users').doc(userId);
    await userDoc.update({
      ...updateData,
      updatedAt: new Date(),
    });

    const updatedDoc = await userDoc.get();
    const userData = convertTimestamp(updatedDoc.data());
    const { password, ...profile } = userData as any;

    res.json({ success: true, data: { id: updatedDoc.id, ...profile } });
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function changePassword(req: Request, res: Response): Promise<void> {
  try {

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      res.status(400).json({ error: 'Current password and new password are required' });
      return;
    }

    if (newPassword.length < 8) {
      res.status(400).json({ error: 'New password must be at least 8 characters' });
      return;
    }

    // BetterAuth handles password changes through its own endpoints
    // This is a placeholder - you may need to integrate with BetterAuth's password change API
    res.json({ success: true, message: 'Password change initiated. Please use BetterAuth password change endpoint.' });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

