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
exports.removeYield = exports.patchYieldStock = exports.putYield = exports.getCategories = exports.postYield = exports.getYield = exports.listYields = void 0;
const yieldService = __importStar(require("./yield.service"));
const listYields = async (req, res) => {
    try {
        const { category, region, search, isWholesale, isOrganic } = req.query;
        const yields = await yieldService.getAllYields({
            category: category,
            region: region,
            search: search,
            isWholesale: isWholesale ? isWholesale === 'true' : undefined,
            isOrganic: isOrganic ? isOrganic === 'true' : undefined,
        });
        res.status(200).json(yields);
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Failed to fetch yields' });
    }
};
exports.listYields = listYields;
const getYield = async (req, res) => {
    try {
        const yieldItem = await yieldService.getYieldById(req.params.id);
        res.status(200).json(yieldItem);
    }
    catch (error) {
        res.status(404).json({ message: error.message || 'Yield not found' });
    }
};
exports.getYield = getYield;
const postYield = async (req, res) => {
    try {
        if (!req.user?.id) {
            res.status(401).json({ message: 'Authentication required' });
            return;
        }
        const newYield = await yieldService.createYield(req.user.id, req.body);
        res.status(201).json({ message: 'Yield created successfully', yield: newYield });
    }
    catch (error) {
        res.status(400).json({ message: error.message || 'Failed to create yield' });
    }
};
exports.postYield = postYield;
const getCategories = async (_req, res) => {
    try {
        const categories = await yieldService.getAllCategories();
        res.status(200).json(categories);
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Failed to fetch categories' });
    }
};
exports.getCategories = getCategories;
const putYield = async (req, res) => {
    try {
        if (!req.user?.id) {
            res.status(401).json({ message: 'Authentication required' });
            return;
        }
        const updatedYield = await yieldService.updateYield(req.user.id, req.user.role || 'FARMER', req.params.id, req.body);
        res.status(200).json({ message: 'Yield updated successfully', yield: updatedYield });
    }
    catch (error) {
        const status = error.message.includes('Forbidden') ? 403 : error.message.includes('not found') ? 404 : 400;
        res.status(status).json({ message: error.message || 'Failed to update yield' });
    }
};
exports.putYield = putYield;
const patchYieldStock = async (req, res) => {
    try {
        if (!req.user?.id) {
            res.status(401).json({ message: 'Authentication required' });
            return;
        }
        const { delta, stockQuantity, isAvailable } = req.body;
        const updatedYield = await yieldService.updateYield(req.user.id, req.user.role || 'FARMER', req.params.id, {
            stockDelta: delta !== undefined ? Number(delta) : undefined,
            stockQuantity: stockQuantity !== undefined ? Number(stockQuantity) : undefined,
            isAvailable: isAvailable !== undefined ? Boolean(isAvailable) : undefined,
        });
        res.status(200).json({ message: 'Harvest stock updated successfully', yield: updatedYield });
    }
    catch (error) {
        const status = error.message.includes('Forbidden') ? 403 : error.message.includes('not found') ? 404 : 400;
        res.status(status).json({ message: error.message || 'Failed to update harvest stock' });
    }
};
exports.patchYieldStock = patchYieldStock;
const removeYield = async (req, res) => {
    try {
        if (!req.user?.id) {
            res.status(401).json({ message: 'Authentication required' });
            return;
        }
        await yieldService.deleteYield(req.user.id, req.user.role || 'FARMER', req.params.id);
        res.status(200).json({ message: 'Yield listing archived successfully' });
    }
    catch (error) {
        const status = error.message.includes('Forbidden') ? 403 : 400;
        res.status(status).json({ message: error.message || 'Failed to archive yield' });
    }
};
exports.removeYield = removeYield;
