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
exports.me = exports.login = exports.register = void 0;
const authService = __importStar(require("../services/authService"));
const register = async (req, res) => {
    try {
        const { name, email, phone, password, role, farmName, region, city, cooperativeName, businessName, primaryMarketCity } = req.body;
        if (!name || !email || !phone || !password) {
            return res.status(400).json({ message: 'Name, email, phone, and password are required' });
        }
        const result = await authService.registerUser({
            name,
            email,
            phone,
            password,
            role,
            farmName,
            region,
            city,
            cooperativeName,
            businessName,
            primaryMarketCity,
        });
        res.status(201).json(result);
    }
    catch (error) {
        console.error('Registration error:', error.message);
        res.status(400).json({ message: error.message || 'Registration failed' });
    }
};
exports.register = register;
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: 'Email/Phone and password are required' });
        }
        const result = await authService.loginUser(email, password);
        res.json(result);
    }
    catch (error) {
        console.error('Login error:', error.message);
        res.status(401).json({ message: error.message || 'Invalid credentials' });
    }
};
exports.login = login;
const me = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const profile = await authService.getCurrentUserProfile(req.user.id);
        res.json({ user: profile });
    }
    catch (error) {
        res.status(404).json({ message: error.message || 'User not found' });
    }
};
exports.me = me;
