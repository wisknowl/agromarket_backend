import { Router } from 'express';
import { getFlags, setFlag, getDisputes, resolveDisputeOrder, getOverviewStats } from './admin.controller';
import { authenticateJWT } from '../../core/middleware/authMiddleware';
import { requireRole } from '../../core/middleware/roleMiddleware';
import { UserRole } from '@prisma/client';

const router = Router();

// Publicly readable for app bootstrap config
router.get('/feature-flags', getFlags);

// Protected Super Admin routes
router.use(authenticateJWT);
router.use(requireRole([UserRole.ADMIN]));

router.post('/feature-flags', setFlag);
router.get('/disputes', getDisputes);
router.post('/disputes/:id/resolve', resolveDisputeOrder);
router.get('/stats', getOverviewStats);

export default router;
