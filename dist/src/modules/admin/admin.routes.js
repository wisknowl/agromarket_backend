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
router.post('/feature-flags', admin_controller_1.setFlag);
router.get('/disputes', admin_controller_1.getDisputes);
router.post('/disputes/:id/resolve', admin_controller_1.resolveDisputeOrder);
router.get('/stats', admin_controller_1.getOverviewStats);
exports.default = router;
