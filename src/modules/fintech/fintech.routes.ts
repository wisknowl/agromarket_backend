import { Router } from 'express';
import {
  getCreditScore,
  getLoanProducts,
  applyLoan,
  getMyLoans,
  getCampaigns,
  createCampaign,
  investInCampaign,
  getMyInvestments,
  patronizeFarmController,
  getPatronStatusController,
  getMyPatronagesController,
} from './fintech.controller';
import { authenticateJWT } from '../../core/middleware/authMiddleware';
import { requireRole } from '../../core/middleware/roleMiddleware';
import { UserRole } from '@prisma/client';

const router = Router();

router.get('/credit-score', authenticateJWT, requireRole([UserRole.FARMER, UserRole.ADMIN]), getCreditScore);
router.get('/products', getLoanProducts);
router.get('/loans/products', getLoanProducts);
router.get('/my-loans', authenticateJWT, requireRole([UserRole.FARMER, UserRole.ADMIN]), getMyLoans);
router.post('/apply', authenticateJWT, requireRole([UserRole.FARMER, UserRole.ADMIN]), applyLoan);
router.post('/loans/apply', authenticateJWT, requireRole([UserRole.FARMER, UserRole.ADMIN]), applyLoan);

// AgroVestor: Peer-to-Farm Crowdlending & Harvest Investing
router.get('/campaigns', getCampaigns);
router.post('/campaigns', authenticateJWT, requireRole([UserRole.FARMER, UserRole.ADMIN]), createCampaign);
router.post('/invest', authenticateJWT, investInCampaign);
router.get('/my-investments', authenticateJWT, getMyInvestments);

// AgroPatron: Micro-Patronage & Farm Pass ($2 subscription)
router.post('/patronize', authenticateJWT, patronizeFarmController);
router.get('/patron-status/:farmerId', authenticateJWT, getPatronStatusController);
router.get('/my-patronages', authenticateJWT, getMyPatronagesController);

export default router;
