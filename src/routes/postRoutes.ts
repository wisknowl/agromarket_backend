import { Router } from 'express';
import * as postController from '../controllers/postController';
import { authenticateJWT } from '../middleware/authMiddleware';
import { authorizeRoles } from '../middleware/roleMiddleware';
import { UserRole } from '@prisma/client';

const router = Router();

router.get('/feed', postController.getFeed);
router.post('/', authenticateJWT, authorizeRoles([UserRole.FARMER, UserRole.ADMIN]), postController.createPost);
router.post('/:id/like', authenticateJWT, postController.likePost);
router.post('/:id/comment', authenticateJWT, postController.commentPost);

export default router;
