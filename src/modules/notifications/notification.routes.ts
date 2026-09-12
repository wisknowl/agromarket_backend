import { Router } from 'express';
import { getMyNotifications, markAsRead, markAllAsRead } from './notification.controller';
import { authenticateJWT } from '../../core/middleware/authMiddleware';

const router = Router();

router.get('/', authenticateJWT, getMyNotifications);
router.patch('/:id/read', authenticateJWT, markAsRead);
router.post('/read-all', authenticateJWT, markAllAsRead);

export default router;
