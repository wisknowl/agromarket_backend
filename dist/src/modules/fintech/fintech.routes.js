"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const fintech_controller_1 = require("./fintech.controller");
const authMiddleware_1 = require("../../core/middleware/authMiddleware");
const roleMiddleware_1 = require("../../core/middleware/roleMiddleware");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
router.get('/credit-score', authMiddleware_1.authenticateJWT, (0, roleMiddleware_1.requireRole)([client_1.UserRole.FARMER, client_1.UserRole.ADMIN]), fintech_controller_1.getCreditScore);
router.get('/products', fintech_controller_1.getLoanProducts);
router.get('/loans/products', fintech_controller_1.getLoanProducts);
router.get('/my-loans', authMiddleware_1.authenticateJWT, (0, roleMiddleware_1.requireRole)([client_1.UserRole.FARMER, client_1.UserRole.ADMIN]), fintech_controller_1.getMyLoans);
router.post('/apply', authMiddleware_1.authenticateJWT, (0, roleMiddleware_1.requireRole)([client_1.UserRole.FARMER, client_1.UserRole.ADMIN]), fintech_controller_1.applyLoan);
router.post('/loans/apply', authMiddleware_1.authenticateJWT, (0, roleMiddleware_1.requireRole)([client_1.UserRole.FARMER, client_1.UserRole.ADMIN]), fintech_controller_1.applyLoan);
// AgroVestor: Peer-to-Farm Crowdlending & Harvest Investing
router.get('/campaigns', fintech_controller_1.getCampaigns);
router.post('/campaigns', authMiddleware_1.authenticateJWT, (0, roleMiddleware_1.requireRole)([client_1.UserRole.FARMER, client_1.UserRole.ADMIN]), fintech_controller_1.createCampaign);
router.post('/invest', authMiddleware_1.authenticateJWT, fintech_controller_1.investInCampaign);
router.get('/my-investments', authMiddleware_1.authenticateJWT, fintech_controller_1.getMyInvestments);
// AgroPatron: Micro-Patronage & Farm Pass ($2 subscription)
router.post('/patronize', authMiddleware_1.authenticateJWT, fintech_controller_1.patronizeFarmController);
router.get('/patron-status/:farmerId', authMiddleware_1.authenticateJWT, fintech_controller_1.getPatronStatusController);
router.get('/my-patronages', authMiddleware_1.authenticateJWT, fintech_controller_1.getMyPatronagesController);
exports.default = router;
