import { Router } from 'express';
import { register, login, getMe, getPublicProfile, followUser, updateMyProfile } from './auth.controller';
import { authenticateJWT, optionalAuth } from '../../core/middleware/authMiddleware';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticateJWT, getMe);
router.put('/profile', authenticateJWT, updateMyProfile);
router.get('/profile/:id', optionalAuth, getPublicProfile);
router.post('/profile/:id/follow', authenticateJWT, followUser);

export default router;

