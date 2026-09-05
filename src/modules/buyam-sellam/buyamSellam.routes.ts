import { Router } from 'express';
import { getProfile, registerStorefront } from './buyamSellam.controller';
import { authenticateJWT } from '../../core/middleware/authMiddleware';

const router = Router();

router.get('/me', authenticateJWT, getProfile);
router.post('/register', authenticateJWT, registerStorefront);

export default router;
