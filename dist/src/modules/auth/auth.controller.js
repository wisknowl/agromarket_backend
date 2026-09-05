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
exports.followUser = exports.getPublicProfile = exports.getMe = exports.login = exports.register = void 0;
const authService = __importStar(require("./auth.service"));
const register = async (req, res) => {
    try {
        const result = await authService.registerUser(req.body);
        res.status(201).json({
            message: 'Registration successful',
            user: result.user,
            token: result.token,
        });
    }
    catch (error) {
        res.status(400).json({ message: error.message || 'Registration failed' });
    }
};
exports.register = register;
const login = async (req, res) => {
    try {
        const { email, phone, password } = req.body;
        const identifier = email || phone;
        if (!identifier || !password) {
            res.status(400).json({ message: 'Email/phone and password are required' });
            return;
        }
        const result = await authService.loginUser(identifier, password);
        res.status(200).json({
            message: 'Login successful',
            user: result.user,
            token: result.token,
        });
    }
    catch (error) {
        res.status(401).json({ message: error.message || 'Authentication failed' });
    }
};
exports.login = login;
const getMe = async (req, res) => {
    try {
        if (!req.user?.id) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }
        const profile = await authService.getCurrentUserProfile(req.user.id);
        res.status(200).json({ user: profile });
    }
    catch (error) {
        res.status(404).json({ message: error.message || 'Profile not found' });
    }
};
exports.getMe = getMe;
const getPublicProfile = async (req, res) => {
    try {
        const { id } = req.params;
        const currentUserId = req.user?.id;
        const profile = await authService.getUserPublicProfile(id, currentUserId);
        res.status(200).json({ user: profile });
    }
    catch (error) {
        res.status(404).json({ message: error.message || 'Profile not found' });
    }
};
exports.getPublicProfile = getPublicProfile;
const followUser = async (req, res) => {
    try {
        if (!req.user?.id) {
            res.status(401).json({ message: 'Authentication required' });
            return;
        }
        const { id: targetUserId } = req.params;
        const result = await authService.toggleFollowUser(req.user.id, targetUserId);
        res.status(200).json(result);
    }
    catch (error) {
        res.status(400).json({ message: error.message || 'Could not toggle follow' });
    }
};
exports.followUser = followUser;
