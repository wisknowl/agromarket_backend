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
exports.campayWebhookHandler = exports.checkPaymentStatus = exports.updateStatus = exports.releaseEscrow = exports.getFarmerSales = exports.getOrder = exports.getMyOrders = exports.checkout = void 0;
const orderService = __importStar(require("./order.service"));
const checkout = async (req, res) => {
    try {
        if (!req.user?.id) {
            res.status(401).json({ message: 'Authentication required' });
            return;
        }
        const order = await orderService.createEscrowOrder(req.user.id, req.body);
        res.status(201).json({ message: 'Order created with Escrow lock', order });
    }
    catch (error) {
        res.status(400).json({ message: error.message || 'Checkout failed' });
    }
};
exports.checkout = checkout;
const getMyOrders = async (req, res) => {
    try {
        if (!req.user?.id) {
            res.status(401).json({ message: 'Authentication required' });
            return;
        }
        const orders = await orderService.getBuyerOrders(req.user.id);
        res.status(200).json(orders);
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Failed to fetch orders' });
    }
};
exports.getMyOrders = getMyOrders;
const getOrder = async (req, res) => {
    try {
        if (!req.user?.id) {
            res.status(401).json({ message: 'Authentication required' });
            return;
        }
        const order = await orderService.getOrderById(req.params.id, req.user.id);
        res.status(200).json(order);
    }
    catch (error) {
        res.status(404).json({ message: error.message || 'Order not found' });
    }
};
exports.getOrder = getOrder;
const getFarmerSales = async (req, res) => {
    try {
        if (!req.user?.id) {
            res.status(401).json({ message: 'Authentication required' });
            return;
        }
        const sales = await orderService.getFarmerOrders(req.user.id);
        res.status(200).json(sales);
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Failed to fetch sales' });
    }
};
exports.getFarmerSales = getFarmerSales;
const releaseEscrow = async (req, res) => {
    try {
        if (!req.user?.id) {
            res.status(401).json({ message: 'Authentication required' });
            return;
        }
        const result = await orderService.releaseEscrowFunds(req.params.id, req.user.id);
        res.status(200).json(result);
    }
    catch (error) {
        res.status(400).json({ message: error.message || 'Escrow release failed' });
    }
};
exports.releaseEscrow = releaseEscrow;
const updateStatus = async (req, res) => {
    try {
        if (!req.user?.id) {
            res.status(401).json({ message: 'Authentication required' });
            return;
        }
        const { status } = req.body;
        const order = await orderService.updateOrderStatus(req.params.id, status, req.user.id);
        res.status(200).json({ message: 'Order status updated', order });
    }
    catch (error) {
        res.status(400).json({ message: error.message || 'Failed to update order status' });
    }
};
exports.updateStatus = updateStatus;
const checkPaymentStatus = async (req, res) => {
    try {
        const result = await orderService.checkOrderPaymentStatus(req.params.id);
        res.status(200).json(result);
    }
    catch (error) {
        res.status(404).json({ message: error.message || 'Payment status check failed' });
    }
};
exports.checkPaymentStatus = checkPaymentStatus;
const campayWebhookHandler = async (req, res) => {
    try {
        await orderService.handleCampayWebhook(req.body);
        res.status(200).json({ received: true });
    }
    catch (error) {
        console.error('Campay webhook error:', error);
        res.status(500).json({ message: 'Webhook error' });
    }
};
exports.campayWebhookHandler = campayWebhookHandler;
