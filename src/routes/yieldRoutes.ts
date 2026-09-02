import { Router } from 'express';
import * as yieldController from '../controllers/yieldController';
import { authenticateJWT } from '../middleware/authMiddleware';
import { authorizeRoles } from '../middleware/roleMiddleware';
import { UserRole } from '@prisma/client';

const router = Router();

router.get('/', yieldController.getYields);
router.get('/categories', yieldController.getCategories);
router.get('/:id', yieldController.getYield);
router.post('/', authenticateJWT, authorizeRoles([UserRole.FARMER, UserRole.ADMIN]), yieldController.createYield);

export default router;
