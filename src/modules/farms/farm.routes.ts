import { Router } from 'express';
import {
  createFarm,
  getMyFarms,
  getFarmById,
  updateFarm,
  deleteFarm,
  getFarmAnalytics,
  getPartners,
  getPartnerStatus,
} from './farm.controller';
import { authenticateJWT, optionalAuth } from '../../core/middleware/authMiddleware';

const router = Router();

router.post('/', authenticateJWT, createFarm);
router.get('/my-farms', authenticateJWT, getMyFarms);
router.get('/partners', authenticateJWT, getPartners);
router.get('/partner-status/:targetUserId', authenticateJWT, getPartnerStatus);
router.get('/:id', optionalAuth, getFarmById);
router.put('/:id', authenticateJWT, updateFarm);
router.delete('/:id', authenticateJWT, deleteFarm);
router.get('/:id/analytics', getFarmAnalytics);

export default router;


