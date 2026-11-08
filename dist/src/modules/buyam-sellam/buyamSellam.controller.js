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
exports.registerStorefront = exports.getProfile = exports.updateStoreHandler = exports.getStoreByIdHandler = exports.checkStoreSlugHandler = exports.getAllStoresHandler = exports.getMyStoresHandler = exports.createStoreHandler = void 0;
const buyamSellamService = __importStar(require("./buyamSellam.service"));
const createStoreHandler = async (req, res) => {
    try {
        if (!req.user?.id) {
            res.status(401).json({ message: 'Authentication required' });
            return;
        }
        const store = await buyamSellamService.createOrRegisterStore(req.user.id, req.body);
        res.status(201).json({ message: 'Store created successfully', store });
    }
    catch (error) {
        res.status(400).json({ message: error.message || 'Failed to create store' });
    }
};
exports.createStoreHandler = createStoreHandler;
const getMyStoresHandler = async (req, res) => {
    try {
        if (!req.user?.id) {
            res.status(401).json({ message: 'Authentication required' });
            return;
        }
        const stores = await buyamSellamService.getMyStores(req.user.id);
        res.status(200).json(stores);
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Failed to fetch stores' });
    }
};
exports.getMyStoresHandler = getMyStoresHandler;
const getAllStoresHandler = async (req, res) => {
    try {
        const { search, region } = req.query;
        const stores = await buyamSellamService.getAllPublicStores({
            search: search,
            region: region,
        });
        res.status(200).json(stores);
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Failed to fetch stores' });
    }
};
exports.getAllStoresHandler = getAllStoresHandler;
const checkStoreSlugHandler = async (req, res) => {
    try {
        const name = req.query.name || '';
        const excludeId = req.query.excludeId || undefined;
        const result = await buyamSellamService.checkStoreSlugAvailability(name, excludeId);
        res.status(200).json(result);
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Slug check failed' });
    }
};
exports.checkStoreSlugHandler = checkStoreSlugHandler;
const getStoreByIdHandler = async (req, res) => {
    try {
        const currentUserId = req.user?.id;
        const store = await buyamSellamService.getStoreById(req.params.id, currentUserId);
        res.status(200).json(store);
    }
    catch (error) {
        res.status(404).json({ message: error.message || 'Store not found' });
    }
};
exports.getStoreByIdHandler = getStoreByIdHandler;
const updateStoreHandler = async (req, res) => {
    try {
        if (!req.user?.id) {
            res.status(401).json({ message: 'Authentication required' });
            return;
        }
        const updated = await buyamSellamService.updateStore(req.params.id, req.user.id, req.body);
        res.status(200).json({ message: 'Store updated successfully', store: updated });
    }
    catch (error) {
        res.status(400).json({ message: error.message || 'Failed to update store' });
    }
};
exports.updateStoreHandler = updateStoreHandler;
const getProfile = async (req, res) => {
    try {
        if (!req.user?.id) {
            res.status(401).json({ message: 'Authentication required' });
            return;
        }
        const profile = await buyamSellamService.getWholesalerProfile(req.user.id);
        res.status(200).json(profile);
    }
    catch (error) {
        res.status(404).json({ message: error.message || 'Profile not found' });
    }
};
exports.getProfile = getProfile;
const registerStorefront = async (req, res) => {
    try {
        if (!req.user?.id) {
            res.status(401).json({ message: 'Authentication required' });
            return;
        }
        const profile = await buyamSellamService.registerOrUpdateWholesaler(req.user.id, req.body);
        res.status(200).json({ message: 'Buyam-Sellam profile saved successfully', profile });
    }
    catch (error) {
        res.status(400).json({ message: error.message || 'Failed to update wholesaler profile' });
    }
};
exports.registerStorefront = registerStorefront;
