import { Request, Response } from 'express';
import { AuthRequest } from '../types';
import * as postService from '../services/postService';

export const getFeed = async (req: Request, res: Response) => {
  try {
    const { farmId, userId } = req.query as { farmId?: string; userId?: string };
    const posts = await postService.getAllPosts({ farmId, userId });
    res.json(posts);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createPost = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

    const post = await postService.createPost(req.user.id, req.body);
    res.status(201).json(post);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const likePost = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

    const result = await postService.toggleLikePost(req.params.id, req.user.id);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const commentPost = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    const { content } = req.body;

    if (!content) return res.status(400).json({ message: 'Comment content is required' });

    const comment = await postService.addPostComment(req.params.id, req.user.id, content);
    res.status(201).json(comment);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};
