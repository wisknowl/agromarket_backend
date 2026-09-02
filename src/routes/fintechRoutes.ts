import { Router } from 'express';
import * as fintechController from '../controllers/fintechController';
import { authenticateJWT } from '../middleware/authMiddleware';
import { authorizeRoles } from '../middleware/roleMiddleware';
import { UserRole } from '@prisma/client';

const router = Router();

router.get('/credit-score', authenticateJWT, authorizeRoles([UserRole.FARMER, UserRole.FINANCIAL_OFFICER, UserRole.ADMIN]), fintechController.getCreditScore);
router.get('/loans/products', fintechController.getLoanProducts);
router.post('/loans/apply', authenticateJWT, authorizeRoles([UserRole.FARMER]), fintechController.applyLoan);

export default router;
