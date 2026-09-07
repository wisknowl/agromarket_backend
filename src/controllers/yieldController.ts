import { Request, Response } from 'express';
import { AuthRequest } from '../types';
import * as yieldService from '../services/yieldService';

export const getYields = async (req: Request, res: Response) => {
  try {
    const { category, region, search, farmId, isWholesale, isOrganic } = req.query;
    const yields = await yieldService.getAllYields({
      category: category as string,
      region: region as string,
      search: search as string,
      farmId: farmId as string,
      isWholesale: isWholesale === 'true' ? true : isWholesale === 'false' ? false : undefined,
      isOrganic: isOrganic === 'true' ? true : isOrganic === 'false' ? false : undefined,
    });
    res.json(yields);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getYield = async (req: Request, res: Response) => {
  try {
    const yieldItem = await yieldService.getYieldById(req.params.id);
    res.json(yieldItem);
  } catch (error: any) {
    res.status(404).json({ message: error.message });
  }
};

export const createYield = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

    const newYield = await yieldService.createYield(req.user.id, req.body);
    res.status(201).json(newYield);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getCategories = async (_req: Request, res: Response) => {
  try {
    const categories = await yieldService.getAllCategories();
    res.json(categories);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
