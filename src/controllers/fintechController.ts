import { Request, Response } from 'express';
import { AuthRequest } from '../types';
import * as fintechService from '../services/fintechService';

export const getCreditScore = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

    const creditData = await fintechService.getFarmerCreditScore(req.user.id);
    res.json(creditData);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getLoanProducts = async (_req: Request, res: Response) => {
  try {
    const products = await fintechService.getAvailableLoanProducts();
    res.json(products);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const applyLoan = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

    const application = await fintechService.applyForSeasonalLoan(req.user.id, req.body);
    res.status(201).json(application);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};
