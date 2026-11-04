import { Router } from 'express';
import {
  createStoreHandler,
  getMyStoresHandler,
  checkStoreSlugHandler,
  getStoreByIdHandler,
  updateStoreHandler,
  getProfile,
  registerStorefront,
} from './buyamSellam.controller';
import { authenticateJWT, optionalAuth } from '../../core/middleware/authMiddleware';

const router = Router();

// Multi-Store Management Endpoints
router.post('/', authenticateJWT, createStoreHandler);
router.get('/my-stores', authenticateJWT, getMyStoresHandler);
router.get('/me', authenticateJWT, getProfile);
router.get('/check-slug', checkStoreSlugHandler);
router.post('/register', authenticateJWT, registerStorefront);
router.get('/:id', optionalAuth, getStoreByIdHandler);
router.put('/:id', authenticateJWT, updateStoreHandler);

export default router;
