import { Router } from 'express';
import { getCreditScore, getLoanProducts, applyLoan } from './fintech.controller';
import { authenticateJWT } from '../../core/middleware/authMiddleware';
import { requireRole } from '../../core/middleware/roleMiddleware';
import { UserRole } from '@prisma/client';

const router = Router();

router.get('/credit-score', authenticateJWT, requireRole([UserRole.FARMER, UserRole.ADMIN]), getCreditScore);
router.get('/products', getLoanProducts);
router.post('/apply', authenticateJWT, requireRole([UserRole.FARMER, UserRole.ADMIN]), applyLoan);

export default router;
