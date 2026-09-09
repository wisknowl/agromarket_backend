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
exports.deleteFeedPost = exports.commentPost = exports.likePost = exports.createFeedPost = exports.getFeed = void 0;
const postService = __importStar(require("./post.service"));
const getFeed = async (req, res) => {
    try {
        const { farmId, userId } = req.query;
        const posts = await postService.getAllPosts({ farmId, userId });
        res.status(200).json(posts);
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Failed to fetch AgroFeed posts' });
    }
};
exports.getFeed = getFeed;
const createFeedPost = async (req, res) => {
    try {
        if (!req.user?.id) {
            res.status(401).json({ message: 'Authentication required' });
            return;
        }
        const post = await postService.createPost(req.user.id, req.body);
        res.status(201).json({ message: 'Post created successfully', post });
    }
    catch (error) {
        res.status(400).json({ message: error.message || 'Failed to publish post' });
    }
};
exports.createFeedPost = createFeedPost;
const likePost = async (req, res) => {
    try {
        if (!req.user?.id) {
            res.status(401).json({ message: 'Authentication required' });
            return;
        }
        const result = await postService.toggleLikePost(req.params.id, req.user.id);
        res.status(200).json(result);
    }
    catch (error) {
        res.status(400).json({ message: error.message || 'Failed to toggle like' });
    }
};
exports.likePost = likePost;
const commentPost = async (req, res) => {
    try {
        if (!req.user?.id) {
            res.status(401).json({ message: 'Authentication required' });
            return;
        }
        const { content } = req.body;
        if (!content) {
            res.status(400).json({ message: 'Comment content cannot be empty' });
            return;
        }
        const comment = await postService.addPostComment(req.params.id, req.user.id, content);
        res.status(201).json({ message: 'Comment added', comment });
    }
    catch (error) {
        res.status(400).json({ message: error.message || 'Failed to add comment' });
    }
};
exports.commentPost = commentPost;
const deleteFeedPost = async (req, res) => {
    try {
        if (!req.user?.id) {
            res.status(401).json({ message: 'Authentication required' });
            return;
        }
        const result = await postService.deletePost(req.params.id, req.user.id, req.user.role);
        res.status(200).json(result);
    }
    catch (error) {
        const statusCode = error.message === 'Post not found' ? 404 : error.message.includes('Unauthorized') ? 403 : 400;
        res.status(statusCode).json({ message: error.message || 'Failed to delete post' });
    }
};
exports.deleteFeedPost = deleteFeedPost;
