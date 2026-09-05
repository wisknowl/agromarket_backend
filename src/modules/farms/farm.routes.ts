import { Router } from 'express';
import {
  createFarm,
  getMyFarms,
  getFarmById,
  updateFarm,
  getFarmAnalytics,
} from './farm.controller';
import { authenticateJWT, optionalAuth } from '../../core/middleware/authMiddleware';

const router = Router();

router.post('/', authenticateJWT, createFarm);
router.get('/my-farms', authenticateJWT, getMyFarms);
router.get('/:id', optionalAuth, getFarmById);
router.put('/:id', authenticateJWT, updateFarm);
router.get('/:id/analytics', getFarmAnalytics);

export default router;
