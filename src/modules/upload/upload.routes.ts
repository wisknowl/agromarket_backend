import { Router } from 'express';
import { uploadMiddleware, handleMediaUpload } from './upload.controller';

const router = Router();

// Accept single file with field name 'file' or 'media'
router.post('/', uploadMiddleware.single('file'), handleMediaUpload);
router.post('/media', uploadMiddleware.single('media'), handleMediaUpload);

export default router;
