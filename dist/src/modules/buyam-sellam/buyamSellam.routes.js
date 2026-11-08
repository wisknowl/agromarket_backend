"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const buyamSellam_controller_1 = require("./buyamSellam.controller");
const authMiddleware_1 = require("../../core/middleware/authMiddleware");
const router = (0, express_1.Router)();
// Multi-Store Management Endpoints
router.get('/', buyamSellam_controller_1.getAllStoresHandler);
router.post('/', authMiddleware_1.authenticateJWT, buyamSellam_controller_1.createStoreHandler);
router.get('/my-stores', authMiddleware_1.authenticateJWT, buyamSellam_controller_1.getMyStoresHandler);
router.get('/me', authMiddleware_1.authenticateJWT, buyamSellam_controller_1.getProfile);
router.get('/check-slug', buyamSellam_controller_1.checkStoreSlugHandler);
router.post('/register', authMiddleware_1.authenticateJWT, buyamSellam_controller_1.registerStorefront);
router.get('/:id', authMiddleware_1.optionalAuth, buyamSellam_controller_1.getStoreByIdHandler);
router.put('/:id', authMiddleware_1.authenticateJWT, buyamSellam_controller_1.updateStoreHandler);
exports.default = router;
