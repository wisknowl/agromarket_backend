"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = void 0;
const client_1 = require("@prisma/client");
const requireRole = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({ message: 'Authentication required' });
            return;
        }
        if (!allowedRoles.includes(req.user.role) && req.user.role !== client_1.UserRole.ADMIN) {
            res.status(403).json({
                message: `Forbidden: Requires one of [${allowedRoles.join(', ')}] role privileges`,
            });
            return;
        }
        next();
    };
};
exports.requireRole = requireRole;
