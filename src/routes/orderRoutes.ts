import { Router } from 'express';
import * as orderController from '../controllers/orderController';
import { authenticateJWT } from '../middleware/authMiddleware';

const router = Router();

router.post('/checkout', authenticateJWT, orderController.checkout);
router.get('/my-orders', authenticateJWT, orderController.getMyOrders);
router.get('/farmer-orders', authenticateJWT, orderController.getFarmerOrders);
router.post('/:id/confirm-receipt', authenticateJWT, orderController.confirmReceiptAndReleaseEscrow);

export default router;
