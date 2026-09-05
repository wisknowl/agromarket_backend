import { Request, Response } from 'express';
import * as authService from './auth.service';
import { AuthRequest } from '../../core/types';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await authService.registerUser(req.body);
    res.status(201).json({
      message: 'Registration successful',
      user: result.user,
      token: result.token,
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Registration failed' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
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
  } catch (error: any) {
    res.status(401).json({ message: error.message || 'Authentication failed' });
  }
};

export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const profile = await authService.getCurrentUserProfile(req.user.id);
    res.status(200).json({ user: profile });
  } catch (error: any) {
    res.status(404).json({ message: error.message || 'Profile not found' });
  }
};

export const getPublicProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const currentUserId = req.user?.id;
    const profile = await authService.getUserPublicProfile(id, currentUserId);
    res.status(200).json({ user: profile });
  } catch (error: any) {
    res.status(404).json({ message: error.message || 'Profile not found' });
  }
};

export const followUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }
    const { id: targetUserId } = req.params;
    const result = await authService.toggleFollowUser(req.user.id, targetUserId);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Could not toggle follow' });
  }
};

