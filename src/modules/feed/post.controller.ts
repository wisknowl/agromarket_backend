import { Request, Response } from 'express';
import * as postService from './post.service';
import { AuthRequest } from '../../core/types';

export const getFeed = async (req: Request, res: Response): Promise<void> => {
  try {
    const { farmId, userId } = req.query as { farmId?: string; userId?: string };
    const posts = await postService.getAllPosts({ farmId, userId });
    res.status(200).json(posts);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to fetch AgroFeed posts' });
  }
};

export const createFeedPost = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }
    const post = await postService.createPost(req.user.id, req.body);
    res.status(201).json({ message: 'Post created successfully', post });
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Failed to publish post' });
  }
};

export const likePost = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }
    const result = await postService.toggleLikePost(req.params.id, req.user.id);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Failed to toggle like' });
  }
};

export const commentPost = async (req: AuthRequest, res: Response): Promise<void> => {
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
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Failed to add comment' });
  }
};
