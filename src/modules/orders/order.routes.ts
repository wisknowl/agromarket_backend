import { Router } from 'express';
import {
  checkout,
  getMyOrders,
  getOrder,
  getFarmerSales,
  releaseEscrow,
  updateStatus,
  checkPaymentStatus,
  campayWebhookHandler,
} from './order.controller';
import { authenticateJWT } from '../../core/middleware/authMiddleware';
import { requireRole } from '../../core/middleware/roleMiddleware';
import { UserRole } from '@prisma/client';

const router = Router();

// Campay Webhook Callback (Public for aggregator callbacks)
router.post('/webhook/campay', campayWebhookHandler);

router.post('/checkout', authenticateJWT, checkout);
router.get('/my-orders', authenticateJWT, getMyOrders);
router.get('/farmer-sales', authenticateJWT, requireRole([UserRole.FARMER, UserRole.ADMIN]), getFarmerSales);
router.get('/:id', authenticateJWT, getOrder);
router.get('/:id/payment-status', authenticateJWT, checkPaymentStatus);
router.put('/:id/status', authenticateJWT, updateStatus);
router.post('/:id/release-escrow', authenticateJWT, releaseEscrow);
router.post('/:id/confirm-receipt', authenticateJWT, releaseEscrow);

export default router;

