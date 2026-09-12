import { Response } from 'express';
import * as chatService from './chat.service';
import { AuthRequest } from '../../core/types';

export const getConversations = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }
    const conversations = await chatService.getUserConversations(req.user.id);
    res.status(200).json(conversations);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to fetch conversations' });
  }
};

export const getMessages = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const messages = await chatService.getConversationMessages(req.params.conversationId);
    res.status(200).json(messages);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to fetch messages' });
  }
};

export const postMessage = async (req: AuthRequest, res: Response): Promise<void> => {
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
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Failed to send message' });
  }
};

export const getConversationDetails = async (req: AuthRequest, res: Response): Promise<void> => {
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
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to fetch conversation' });
  }
};

export const getOrCreateConversation = async (req: AuthRequest, res: Response): Promise<void> => {
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
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to initialize conversation' });
  }
};


