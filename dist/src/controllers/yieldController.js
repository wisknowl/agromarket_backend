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
exports.getCategories = exports.createYield = exports.getYield = exports.getYields = void 0;
const yieldService = __importStar(require("../services/yieldService"));
const getYields = async (req, res) => {
    try {
        const { category, region, search, isWholesale, isOrganic } = req.query;
        const yields = await yieldService.getAllYields({
            category: category,
            region: region,
            search: search,
            isWholesale: isWholesale === 'true' ? true : isWholesale === 'false' ? false : undefined,
            isOrganic: isOrganic === 'true' ? true : isOrganic === 'false' ? false : undefined,
        });
        res.json(yields);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.getYields = getYields;
const getYield = async (req, res) => {
    try {
        const yieldItem = await yieldService.getYieldById(req.params.id);
        res.json(yieldItem);
    }
    catch (error) {
        res.status(404).json({ message: error.message });
    }
};
exports.getYield = getYield;
const createYield = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ message: 'Unauthorized' });
        const newYield = await yieldService.createYield(req.user.id, req.body);
        res.status(201).json(newYield);
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.createYield = createYield;
const getCategories = async (_req, res) => {
    try {
        const categories = await yieldService.getAllCategories();
        res.json(categories);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.getCategories = getCategories;
