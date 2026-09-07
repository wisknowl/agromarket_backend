import { Router } from 'express';
import { getCreditScore, getLoanProducts, applyLoan, getMyLoans } from './fintech.controller';
import { authenticateJWT } from '../../core/middleware/authMiddleware';
import { requireRole } from '../../core/middleware/roleMiddleware';
import { UserRole } from '@prisma/client';

const router = Router();

router.get('/credit-score', authenticateJWT, requireRole([UserRole.FARMER, UserRole.ADMIN]), getCreditScore);
router.get('/products', getLoanProducts);
router.get('/loans/products', getLoanProducts);
router.get('/my-loans', authenticateJWT, requireRole([UserRole.FARMER, UserRole.ADMIN]), getMyLoans);
router.post('/apply', authenticateJWT, requireRole([UserRole.FARMER, UserRole.ADMIN]), applyLoan);
router.post('/loans/apply', authenticateJWT, requireRole([UserRole.FARMER, UserRole.ADMIN]), applyLoan);

export default router;
