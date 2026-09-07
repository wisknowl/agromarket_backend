import { Router } from 'express';
import {
  getFlags,
  setFlag,
  getOverviewStats,
  getUsers,
  updateUser,
  verifyUser,
  setFarmerTier,
  getFarms,
  verifyFarm,
  getLoans,
  getFinancialInstitutions,
  setLoanStatus,
  getDisputes,
  resolveDisputeOrder,
} from './admin.controller';
import { authenticateJWT } from '../../core/middleware/authMiddleware';
import { requireRole } from '../../core/middleware/roleMiddleware';
import { UserRole } from '@prisma/client';

const router = Router();

// Publicly readable for app bootstrap config
router.get('/feature-flags', getFlags);

// Protected Super Admin routes
router.use(authenticateJWT);
router.use(requireRole([UserRole.ADMIN]));

router.get('/stats', getOverviewStats);
router.post('/feature-flags', setFlag);

// Users & Verification
router.get('/users', getUsers);
router.put('/users/:id', updateUser);
router.patch('/users/:id/verify', verifyUser);
router.patch('/farmers/:id/tier', setFarmerTier);

// Farms & Catalog
router.get('/farms', getFarms);
router.patch('/farms/:id/verify', verifyFarm);

// Fintech Loans & Financial Institutions
router.get('/loans', getLoans);
router.get('/financial-institutions', getFinancialInstitutions);
router.patch('/loans/:id/status', setLoanStatus);

// Disputes & Arbitration
router.get('/disputes', getDisputes);
router.post('/disputes/:id/resolve', resolveDisputeOrder);

export default router;
