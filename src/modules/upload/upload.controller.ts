import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import multer from 'multer';

// Ensure uploads folder exists
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || (file.mimetype.includes('video') ? '.mp4' : '.jpg');
    const uniqueName = `agromarket-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, uniqueName);
  },
});

export const uploadMiddleware = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100 MB max for videos/photos
  },
});

export const handleMediaUpload = async (req: Request, res: Response): Promise<void> => {
  try {
    const file = req.file;
    if (!file) {
      res.status(400).json({ message: 'No media file provided in request' });
      return;
    }

    const host = req.get('host') || 'localhost:5000';
    const protocol = req.protocol || 'http';
    const fileUrl = `${protocol}://${host}/uploads/${file.filename}`;
    const isVideo = file.mimetype.startsWith('video/') || file.filename.endsWith('.mp4') || file.filename.endsWith('.mov');

    console.log(`📁 [UPLOAD SUCCESS] Saved: ${file.filename} (${(file.size / (1024 * 1024)).toFixed(2)} MB) -> ${fileUrl}`);

    res.status(200).json({
      success: true,
      url: fileUrl,
      filename: file.filename,
      mimetype: file.mimetype,
      isVideo,
      size: file.size,
    });
  } catch (error: any) {
    console.error('❌ [UPLOAD ERROR]', error);
    res.status(500).json({ message: error.message || 'Media upload failed' });
  }
};
