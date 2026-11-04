import { Request, Response } from 'express';
import * as buyamSellamService from './buyamSellam.service';
import { AuthRequest } from '../../core/types';

export const createStoreHandler = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }
    const store = await buyamSellamService.createOrRegisterStore(req.user.id, req.body);
    res.status(201).json({ message: 'Store created successfully', store });
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Failed to create store' });
  }
};

export const getMyStoresHandler = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }
    const stores = await buyamSellamService.getMyStores(req.user.id);
    res.status(200).json(stores);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to fetch stores' });
  }
};

export const checkStoreSlugHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const name = (req.query.name as string) || '';
    const excludeId = (req.query.excludeId as string) || undefined;
    const result = await buyamSellamService.checkStoreSlugAvailability(name, excludeId);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Slug check failed' });
  }
};

export const getStoreByIdHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const store = await buyamSellamService.getStoreById(req.params.id);
    res.status(200).json(store);
  } catch (error: any) {
    res.status(404).json({ message: error.message || 'Store not found' });
  }
};

export const updateStoreHandler = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }
    const updated = await buyamSellamService.updateStore(req.params.id, req.user.id, req.body);
    res.status(200).json({ message: 'Store updated successfully', store: updated });
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Failed to update store' });
  }
};

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
