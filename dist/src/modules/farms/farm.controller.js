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
exports.getFarmAnalytics = exports.updateFarm = exports.getFarmById = exports.getMyFarms = exports.createFarm = void 0;
const farmService = __importStar(require("./farm.service"));
const createFarm = async (req, res) => {
    try {
        if (!req.user?.id) {
            res.status(401).json({ message: 'Authentication required' });
            return;
        }
        const farm = await farmService.createOrRegisterFarm(req.user.id, req.body);
        res.status(201).json({ message: 'Farm created successfully', farm });
    }
    catch (error) {
        res.status(400).json({ message: error.message || 'Failed to create farm' });
    }
};
exports.createFarm = createFarm;
const getMyFarms = async (req, res) => {
    try {
        if (!req.user?.id) {
            res.status(401).json({ message: 'Authentication required' });
            return;
        }
        const farms = await farmService.getMyFarmsList(req.user.id);
        res.status(200).json(farms);
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Failed to fetch farms' });
    }
};
exports.getMyFarms = getMyFarms;
const getFarmById = async (req, res) => {
    try {
        const farm = await farmService.getFarmById(req.params.id, req.user?.id);
        res.status(200).json(farm);
    }
    catch (error) {
        res.status(404).json({ message: error.message || 'Farm not found' });
    }
};
exports.getFarmById = getFarmById;
const updateFarm = async (req, res) => {
    try {
        if (!req.user?.id) {
            res.status(401).json({ message: 'Authentication required' });
            return;
        }
        const farm = await farmService.updateFarm(req.params.id, req.user.id, req.body);
        res.status(200).json({ message: 'Farm updated successfully', farm });
    }
    catch (error) {
        res.status(400).json({ message: error.message || 'Failed to update farm' });
    }
};
exports.updateFarm = updateFarm;
const getFarmAnalytics = async (req, res) => {
    try {
        const analytics = await farmService.getFarmAnalytics(req.params.id);
        res.status(200).json(analytics);
    }
    catch (error) {
        res.status(404).json({ message: error.message || 'Farm analytics not found' });
    }
};
exports.getFarmAnalytics = getFarmAnalytics;
