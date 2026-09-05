import { Response } from 'express';
import * as buyamSellamService from './buyamSellam.service';
import { AuthRequest } from '../../core/types';

export const getProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }
    const profile = await buyamSellamService.getWholesalerProfile(req.user.id);
    res.status(200).json(profile);
  } catch (error: any) {
    res.status(404).json({ message: error.message || 'Profile not found' });
  }
};

export const registerStorefront = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }
    const profile = await buyamSellamService.registerOrUpdateWholesaler(req.user.id, req.body);
    res.status(200).json({ message: 'Buyam-Sellam profile saved successfully', profile });
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Failed to update wholesaler profile' });
  }
};
