import { Router } from 'express';
import { getFeed, createFeedPost, likePost, commentPost, deleteFeedPost } from './post.controller';
import { authenticateJWT } from '../../core/middleware/authMiddleware';
import { requireRole } from '../../core/middleware/roleMiddleware';
import { UserRole } from '@prisma/client';

const router = Router();

router.get('/', getFeed);
router.get('/feed', getFeed);
router.post('/', authenticateJWT, requireRole([UserRole.FARMER, UserRole.ADMIN]), createFeedPost);
router.post('/:id/like', authenticateJWT, likePost);
router.post('/:id/comments', authenticateJWT, commentPost);
router.post('/:id/comment', authenticateJWT, commentPost);
router.delete('/:id', authenticateJWT, deleteFeedPost);

export default router;
