import { Request, Response } from 'express';
import * as yieldService from './yield.service';
import { AuthRequest } from '../../core/types';

export const listYields = async (req: Request, res: Response): Promise<void> => {
  try {
    const { category, region, search, isWholesale, isOrganic } = req.query;
    const yields = await yieldService.getAllYields({
      category: category as string,
      region: region as string,
      search: search as string,
      isWholesale: isWholesale ? isWholesale === 'true' : undefined,
      isOrganic: isOrganic ? isOrganic === 'true' : undefined,
    });
    res.status(200).json(yields);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to fetch yields' });
  }
};

export const getYield = async (req: Request, res: Response): Promise<void> => {
  try {
    const yieldItem = await yieldService.getYieldById(req.params.id);
    res.status(200).json(yieldItem);
  } catch (error: any) {
    res.status(404).json({ message: error.message || 'Yield not found' });
  }
};

export const postYield = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }
    const newYield = await yieldService.createYield(req.user.id, req.body);
    res.status(201).json({ message: 'Yield created successfully', yield: newYield });
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Failed to create yield' });
  }
};

export const getCategories = async (_req: Request, res: Response): Promise<void> => {
  try {
    const categories = await yieldService.getAllCategories();
    res.status(200).json(categories);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to fetch categories' });
  }
};
