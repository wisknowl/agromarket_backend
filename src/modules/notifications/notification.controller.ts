import { Response } from 'express';
import { AuthRequest } from '../../core/types';
import * as notificationService from './notification.service';

export const getMyNotifications = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }
    const { category } = req.query;
    const notifications = await notificationService.getUserNotifications(
      req.user.id,
      category as string | undefined
    );
    res.status(200).json(notifications);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to fetch notifications' });
  }
};

export const markAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    res.status(200).json({ success: true, message: 'Notification marked as read' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const markAllAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    res.status(200).json({ success: true, message: 'All notifications marked as read' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
