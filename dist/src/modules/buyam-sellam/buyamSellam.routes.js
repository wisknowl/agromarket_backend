"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const buyamSellam_controller_1 = require("./buyamSellam.controller");
const authMiddleware_1 = require("../../core/middleware/authMiddleware");
const router = (0, express_1.Router)();
router.get('/me', authMiddleware_1.authenticateJWT, buyamSellam_controller_1.getProfile);
router.post('/register', authMiddleware_1.authenticateJWT, buyamSellam_controller_1.registerStorefront);
exports.default = router;
