import { Request, Response } from 'express';
import * as farmService from './farm.service';
import { AuthRequest } from '../../core/types';

export const createFarm = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }
    const farm = await farmService.createOrRegisterFarm(req.user.id, req.body);
    res.status(201).json({ message: 'Farm created successfully', farm });
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Failed to create farm' });
  }
};

export const getMyFarms = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }
    const farms = await farmService.getMyFarmsList(req.user.id);
    res.status(200).json(farms);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to fetch farms' });
  }
};

export const getFarmById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const includeAll = req.query.includeAllYields === 'true';
    const farm = await farmService.getFarmById(req.params.id, req.user?.id, includeAll);
    res.status(200).json(farm);
  } catch (error: any) {
    res.status(404).json({ message: error.message || 'Farm not found' });
  }
};

export const updateFarm = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }
    const farm = await farmService.updateFarm(req.params.id, req.user.id, req.body);
    res.status(200).json({ message: 'Farm updated successfully', farm });
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Failed to update farm' });
  }
};

export const getFarmAnalytics = async (req: Request, res: Response): Promise<void> => {
  try {
    const analytics = await farmService.getFarmAnalytics(req.params.id);
    res.status(200).json(analytics);
  } catch (error: any) {
    res.status(404).json({ message: error.message || 'Farm analytics not found' });
  }
};

export const getPartners = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }
    const partners = await farmService.getMutualPartners(req.user.id);
    res.status(200).json(partners);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to fetch mutual partners' });
  }
};

export const getPartnerStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }
    const status = await farmService.checkPartnerStatus(req.user.id, req.params.targetUserId);
    res.status(200).json(status);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to evaluate partner status' });
  }
};

export const deleteFarm = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }
    const targetFarmId = req.body?.targetFarmId || (req.query?.targetFarmId as string | undefined);
    const result = await farmService.deleteFarm(req.params.id, req.user.id, targetFarmId);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Failed to delete farm' });
  }
};


