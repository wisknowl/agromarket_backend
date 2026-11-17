import { Router } from 'express';
import {
  listYields,
  getYield,
  postYield,
  getCategories,
  putYield,
  patchYieldStock,
  removeYield,
  joinYieldWaitlist,
  leaveYieldWaitlist,
} from './yield.controller';
import { authenticateJWT, optionalAuth } from '../../core/middleware/authMiddleware';
import { requireRole } from '../../core/middleware/roleMiddleware';
import { UserRole } from '@prisma/client';

const router = Router();

router.get('/', listYields);
router.get('/categories', getCategories);
router.get('/:id', getYield);
router.post('/', authenticateJWT, requireRole([UserRole.FARMER, UserRole.ADMIN]), postYield);
router.put('/:id', authenticateJWT, requireRole([UserRole.FARMER, UserRole.ADMIN]), putYield);
router.patch('/:id/stock', authenticateJWT, requireRole([UserRole.FARMER, UserRole.ADMIN]), patchYieldStock);
router.delete('/:id', authenticateJWT, requireRole([UserRole.FARMER, UserRole.ADMIN]), removeYield);
router.post('/:id/waitlist', optionalAuth, joinYieldWaitlist);
router.delete('/:id/waitlist', optionalAuth, leaveYieldWaitlist);

export default router;
