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
exports.commentPost = exports.likePost = exports.createPost = exports.getFeed = void 0;
const postService = __importStar(require("../services/postService"));
const getFeed = async (_req, res) => {
    try {
        const posts = await postService.getAllPosts();
        res.json(posts);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.getFeed = getFeed;
const createPost = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ message: 'Unauthorized' });
        const post = await postService.createPost(req.user.id, req.body);
        res.status(201).json(post);
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.createPost = createPost;
const likePost = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ message: 'Unauthorized' });
        const result = await postService.toggleLikePost(req.params.id, req.user.id);
        res.json(result);
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.likePost = likePost;
const commentPost = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ message: 'Unauthorized' });
        const { content } = req.body;
        if (!content)
            return res.status(400).json({ message: 'Comment content is required' });
        const comment = await postService.addPostComment(req.params.id, req.user.id, content);
        res.status(201).json(comment);
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.commentPost = commentPost;
