"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOverviewStats = exports.resolveDisputeOrder = exports.getDisputes = exports.setFlag = exports.getFlags = void 0;
const adminService = __importStar(require("./admin.service"));
const getFlags = async (_req, res) => {
    try {
        const flags = await adminService.getFeatureFlags();
        res.status(200).json(flags);
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Failed to fetch feature flags' });
    }
};
exports.getFlags = getFlags;
const setFlag = async (req, res) => {
    try {
        const { flagName, isEnabled } = req.body;
        if (!flagName || typeof isEnabled !== 'boolean') {
            res.status(400).json({ message: 'flagName (string) and isEnabled (boolean) are required' });
            return;
        }
        const updated = await adminService.updateFeatureFlag(flagName, isEnabled);
        res.status(200).json({ message: `Flag ${flagName} set to ${isEnabled}`, flags: updated });
    }
    catch (error) {
        res.status(400).json({ message: error.message || 'Failed to update feature flag' });
    }
};
exports.setFlag = setFlag;
const getDisputes = async (_req, res) => {
    try {
        const disputes = await adminService.getDisputedOrders();
        res.status(200).json(disputes);
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Failed to fetch disputes' });
    }
};
exports.getDisputes = getDisputes;
const resolveDisputeOrder = async (req, res) => {
    try {
        const { resolution, reason } = req.body;
        const result = await adminService.resolveDispute(req.params.id, resolution, reason);
        res.status(200).json(result);
    }
    catch (error) {
        res.status(400).json({ message: error.message || 'Dispute resolution failed' });
    }
};
exports.resolveDisputeOrder = resolveDisputeOrder;
const getOverviewStats = async (_req, res) => {
    try {
        const stats = await adminService.getPlatformStats();
        res.status(200).json(stats);
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Failed to fetch platform stats' });
    }
};
exports.getOverviewStats = getOverviewStats;
