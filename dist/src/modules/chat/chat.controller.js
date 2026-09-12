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
exports.getOrCreateConversation = exports.getConversationDetails = exports.postMessage = exports.getMessages = exports.getConversations = void 0;
const chatService = __importStar(require("./chat.service"));
const getConversations = async (req, res) => {
    try {
        if (!req.user?.id) {
            res.status(401).json({ message: 'Authentication required' });
            return;
        }
        const conversations = await chatService.getUserConversations(req.user.id);
        res.status(200).json(conversations);
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Failed to fetch conversations' });
    }
};
exports.getConversations = getConversations;
const getMessages = async (req, res) => {
    try {
        const messages = await chatService.getConversationMessages(req.params.conversationId);
        res.status(200).json(messages);
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Failed to fetch messages' });
    }
};
exports.getMessages = getMessages;
const postMessage = async (req, res) => {
    try {
        if (!req.user?.id) {
            res.status(401).json({ message: 'Authentication required' });
            return;
        }
        const { receiverId, content } = req.body;
        if (!receiverId || !content) {
            res.status(400).json({ message: 'receiverId and content are required' });
            return;
        }
        const result = await chatService.sendMessage(req.user.id, receiverId, content);
        res.status(201).json(result);
    }
    catch (error) {
        res.status(400).json({ message: error.message || 'Failed to send message' });
    }
};
exports.postMessage = postMessage;
const getConversationDetails = async (req, res) => {
    try {
        if (!req.user?.id) {
            res.status(401).json({ message: 'Authentication required' });
            return;
        }
        const result = await chatService.getConversationById(req.params.conversationId, req.user.id);
        if (!result) {
            res.status(404).json({ message: 'Conversation not found' });
            return;
        }
        res.status(200).json(result);
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Failed to fetch conversation' });
    }
};
exports.getConversationDetails = getConversationDetails;
const getOrCreateConversation = async (req, res) => {
    try {
        if (!req.user?.id) {
            res.status(401).json({ message: 'Authentication required' });
            return;
        }
        const targetUserId = req.params.userId;
        if (targetUserId === req.user.id) {
            res.status(400).json({ message: 'Cannot chat with yourself' });
            return;
        }
        const result = await chatService.getOrCreateConversationWithUser(req.user.id, targetUserId);
        res.status(200).json(result);
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Failed to initialize conversation' });
    }
};
exports.getOrCreateConversation = getOrCreateConversation;
