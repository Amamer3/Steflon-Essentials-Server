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

export async function getAdminProfile(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const userDoc = await db.collection('users').doc(userId).get();

    if (!userDoc.exists) {
      res.status(404).json({ error: 'Admin not found' });
      return;
    }

    const userData = convertTimestamp(userDoc.data());
    const { password, ...profile } = userData as any;

    res.json({ success: true, data: { id: userDoc.id, ...profile } });
  } catch (error) {
    console.error('Error getting admin profile:', error);
    res.status(500).json({ error: 'Internal server error' });
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
    console.error('Error updating admin profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function changeAdminPassword(req: Request, res: Response): Promise<void> {
  try {
    // BetterAuth handles password changes through its own endpoints
    res.json({
      success: true,
      message: 'Password change initiated. Please use BetterAuth password change endpoint.',
    });
  } catch (error) {
    console.error('Error changing admin password:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

