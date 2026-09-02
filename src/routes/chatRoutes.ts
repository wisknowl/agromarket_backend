import { Router } from 'express';
import * as chatController from '../controllers/chatController';
import { authenticateJWT } from '../middleware/authMiddleware';

const router = Router();

router.get('/conversations', authenticateJWT, chatController.getConversations);
router.get('/conversations/:id/messages', authenticateJWT, chatController.getMessages);
router.post('/messages', authenticateJWT, chatController.sendMessage);

export default router;
