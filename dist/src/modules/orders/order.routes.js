"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const order_controller_1 = require("./order.controller");
const authMiddleware_1 = require("../../core/middleware/authMiddleware");
const roleMiddleware_1 = require("../../core/middleware/roleMiddleware");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
// Campay Webhook Callback (Public for aggregator callbacks)
router.post('/webhook/campay', order_controller_1.campayWebhookHandler);
router.post('/checkout', authMiddleware_1.authenticateJWT, order_controller_1.checkout);
router.get('/my-orders', authMiddleware_1.authenticateJWT, order_controller_1.getMyOrders);
router.get('/farmer-sales', authMiddleware_1.authenticateJWT, (0, roleMiddleware_1.requireRole)([client_1.UserRole.FARMER, client_1.UserRole.ADMIN]), order_controller_1.getFarmerSales);
router.get('/:id', authMiddleware_1.authenticateJWT, order_controller_1.getOrder);
router.get('/:id/payment-status', authMiddleware_1.authenticateJWT, order_controller_1.checkPaymentStatus);
router.put('/:id/status', authMiddleware_1.authenticateJWT, order_controller_1.updateStatus);
router.post('/:id/release-escrow', authMiddleware_1.authenticateJWT, order_controller_1.releaseEscrow);
router.post('/:id/confirm-receipt', authMiddleware_1.authenticateJWT, order_controller_1.releaseEscrow);
exports.default = router;
