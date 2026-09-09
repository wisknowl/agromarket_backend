"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const admin_controller_1 = require("./admin.controller");
const authMiddleware_1 = require("../../core/middleware/authMiddleware");
const roleMiddleware_1 = require("../../core/middleware/roleMiddleware");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
// Publicly readable for app bootstrap config
router.get('/feature-flags', admin_controller_1.getFlags);
// Protected Super Admin routes
router.use(authMiddleware_1.authenticateJWT);
router.use((0, roleMiddleware_1.requireRole)([client_1.UserRole.ADMIN]));
router.get('/stats', admin_controller_1.getOverviewStats);
router.post('/feature-flags', admin_controller_1.setFlag);
// Users & Verification
router.get('/users', admin_controller_1.getUsers);
router.put('/users/:id', admin_controller_1.updateUser);
router.patch('/users/:id/verify', admin_controller_1.verifyUser);
router.patch('/farmers/:id/tier', admin_controller_1.setFarmerTier);
// Farms & Catalog
router.get('/farms', admin_controller_1.getFarms);
router.patch('/farms/:id/verify', admin_controller_1.verifyFarm);
// Fintech Loans & Financial Institutions
router.get('/loans', admin_controller_1.getLoans);
router.get('/financial-institutions', admin_controller_1.getFinancialInstitutions);
router.patch('/loans/:id/status', admin_controller_1.setLoanStatus);
// Disputes & Arbitration
router.get('/disputes', admin_controller_1.getDisputes);
router.post('/disputes/:id/resolve', admin_controller_1.resolveDisputeOrder);
exports.default = router;
