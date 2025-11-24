import { Request, Response } from 'express';

// Placeholder for file upload functionality
// In production, you would use a service like Cloud Storage, S3, or similar
export async function uploadProductImage(req: Request, res: Response): Promise<void> {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    const host = req.get('host');
    const protocol = req.protocol;
    const url = `${protocol}://${host}/uploads/${req.file.filename}`;

    res.json({
      success: true,
      data: {
        url,
        filename: req.file.filename,
      },
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function uploadProductImages(req: Request, res: Response): Promise<void> {
  try {
    if (!req.files || (Array.isArray(req.files) && req.files.length === 0)) {
      res.status(400).json({ error: 'No files uploaded' });
      return;
    }

    const host = req.get('host');
    const protocol = req.protocol;
    const files = req.files as Express.Multer.File[];

    const data = files.map(file => ({
      url: `${protocol}://${host}/uploads/${file.filename}`,
      filename: file.filename,
    }));

    res.json({
      success: true,
      data: {
        files: data,
      },
    });
  } catch (error) {
    console.error('Error uploading images:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

