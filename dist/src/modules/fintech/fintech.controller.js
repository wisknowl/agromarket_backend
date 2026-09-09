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
exports.getMyLoans = exports.applyLoan = exports.getLoanProducts = exports.getCreditScore = void 0;
const fintechService = __importStar(require("./fintech.service"));
const getCreditScore = async (req, res) => {
    try {
        if (!req.user?.id) {
            res.status(401).json({ message: 'Authentication required' });
            return;
        }
        const scoreData = await fintechService.getFarmerCreditScore(req.user.id);
        res.status(200).json(scoreData);
    }
    catch (error) {
        res.status(404).json({ message: error.message || 'Failed to fetch credit score' });
    }
};
exports.getCreditScore = getCreditScore;
const getLoanProducts = async (_req, res) => {
    try {
        const products = await fintechService.getAvailableLoanProducts();
        res.status(200).json(products);
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Failed to fetch loan products' });
    }
};
exports.getLoanProducts = getLoanProducts;
const applyLoan = async (req, res) => {
    try {
        if (!req.user?.id) {
            res.status(401).json({ message: 'Authentication required' });
            return;
        }
        const application = await fintechService.applyForSeasonalLoan(req.user.id, req.body);
        res.status(201).json({ message: 'Loan application submitted successfully', application });
    }
    catch (error) {
        res.status(400).json({ message: error.message || 'Failed to submit loan application' });
    }
};
exports.applyLoan = applyLoan;
const getMyLoans = async (req, res) => {
    try {
        if (!req.user?.id) {
            res.status(401).json({ message: 'Authentication required' });
            return;
        }
        const applications = await fintechService.getMyLoanApplications(req.user.id);
        res.status(200).json(applications);
    }
    catch (error) {
        res.status(400).json({ message: error.message || 'Failed to fetch loan applications' });
    }
};
exports.getMyLoans = getMyLoans;
