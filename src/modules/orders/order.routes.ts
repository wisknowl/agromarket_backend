import { Router } from 'express';
import { checkout, getMyOrders, getFarmerSales, releaseEscrow } from './order.controller';
import { authenticateJWT } from '../../core/middleware/authMiddleware';
import { requireRole } from '../../core/middleware/roleMiddleware';
import { UserRole } from '@prisma/client';

const router = Router();

router.post('/checkout', authenticateJWT, checkout);
router.get('/my-orders', authenticateJWT, getMyOrders);
router.get('/farmer-sales', authenticateJWT, requireRole([UserRole.FARMER, UserRole.ADMIN]), getFarmerSales);
router.post('/:id/release-escrow', authenticateJWT, releaseEscrow);

export default router;
