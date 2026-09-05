import { Router } from 'express';
import { listYields, getYield, postYield, getCategories } from './yield.controller';
import { authenticateJWT } from '../../core/middleware/authMiddleware';
import { requireRole } from '../../core/middleware/roleMiddleware';
import { UserRole } from '@prisma/client';

const router = Router();

router.get('/', listYields);
router.get('/categories', getCategories);
router.get('/:id', getYield);
router.post('/', authenticateJWT, requireRole([UserRole.FARMER, UserRole.ADMIN]), postYield);

export default router;
