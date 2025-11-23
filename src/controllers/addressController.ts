import { Request, Response } from 'express';
import { db } from '../config/firestore';
import { Address } from '../types';

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

export async function getAddresses(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const snapshot = await db.collection('addresses').where('userId', '==', userId).get();

    const addresses = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...convertTimestamp(doc.data()),
    })) as Address[];

    res.json({ success: true, data: addresses });
  } catch (error) {
    console.error('Error getting addresses:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function addAddress(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const addressData = req.body;

    // If this is set as default, unset other defaults
    if (addressData.isDefault) {
      const existingSnapshot = await db
        .collection('addresses')
        .where('userId', '==', userId)
        .where('isDefault', '==', true)
        .get();

      const batch = db.batch();
      existingSnapshot.docs.forEach((doc) => {
        batch.update(doc.ref, { isDefault: false });
      });
      await batch.commit();
    }

    const newAddress: Omit<Address, 'id'> = {
      userId,
      ...addressData,
      isDefault: addressData.isDefault || false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const docRef = await db.collection('addresses').add(newAddress);
    res.json({ success: true, data: { id: docRef.id, ...newAddress } });
  } catch (error) {
    console.error('Error adding address:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function updateAddress(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const addressData = req.body;

    const addressDoc = await db.collection('addresses').doc(id);
    const addressSnapshot = await addressDoc.get();

    if (!addressSnapshot.exists) {
      res.status(404).json({ error: 'Address not found' });
      return;
    }

    const address = convertTimestamp(addressSnapshot.data());
    if (address.userId !== userId) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    // If setting as default, unset other defaults
    if (addressData.isDefault) {
      const existingSnapshot = await db
        .collection('addresses')
        .where('userId', '==', userId)
        .where('isDefault', '==', true)
        .get();

      const batch = db.batch();
      existingSnapshot.docs.forEach((doc) => {
        if (doc.id !== id) {
          batch.update(doc.ref, { isDefault: false });
        }
      });
      await batch.commit();
    }

    await addressDoc.update({
      ...addressData,
      updatedAt: new Date(),
    });

    const updatedDoc = await addressDoc.get();
    res.json({ success: true, data: { id: updatedDoc.id, ...convertTimestamp(updatedDoc.data()) } });
  } catch (error) {
    console.error('Error updating address:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function deleteAddress(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const addressDoc = await db.collection('addresses').doc(id);
    const addressSnapshot = await addressDoc.get();

    if (!addressSnapshot.exists) {
      res.status(404).json({ error: 'Address not found' });
      return;
    }

    const address = convertTimestamp(addressSnapshot.data());
    if (address.userId !== userId) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    await addressDoc.delete();
    res.json({ success: true, message: 'Address deleted' });
  } catch (error) {
    console.error('Error deleting address:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function setDefaultAddress(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const addressDoc = await db.collection('addresses').doc(id);
    const addressSnapshot = await addressDoc.get();

    if (!addressSnapshot.exists) {
      res.status(404).json({ error: 'Address not found' });
      return;
    }

    const address = convertTimestamp(addressSnapshot.data());
    if (address.userId !== userId) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    // Unset other defaults
    const existingSnapshot = await db
      .collection('addresses')
      .where('userId', '==', userId)
      .where('isDefault', '==', true)
      .get();

    const batch = db.batch();
    existingSnapshot.docs.forEach((doc) => {
      batch.update(doc.ref, { isDefault: false });
    });
    batch.update(addressDoc, { isDefault: true, updatedAt: new Date() });
    await batch.commit();

    res.json({ success: true, message: 'Default address updated' });
  } catch (error) {
    console.error('Error setting default address:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

