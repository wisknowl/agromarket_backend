import { Router } from 'express';
import { getConversations, getMessages, postMessage } from './chat.controller';
import { authenticateJWT } from '../../core/middleware/authMiddleware';

const router = Router();

router.get('/conversations', authenticateJWT, getConversations);
router.get('/:conversationId/messages', authenticateJWT, getMessages);
router.post('/messages', authenticateJWT, postMessage);

export default router;
