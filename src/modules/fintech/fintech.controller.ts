import { Request, Response } from 'express';
import * as fintechService from './fintech.service';
import { AuthRequest } from '../../core/types';

export const getCreditScore = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }
    const scoreData = await fintechService.getFarmerCreditScore(req.user.id);
    res.status(200).json(scoreData);
  } catch (error: any) {
    res.status(404).json({ message: error.message || 'Failed to fetch credit score' });
  }
};

export const getLoanProducts = async (_req: Request, res: Response): Promise<void> => {
  try {
    const products = await fintechService.getAvailableLoanProducts();
    res.status(200).json(products);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to fetch loan products' });
  }
};

export const applyLoan = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }
    const application = await fintechService.applyForSeasonalLoan(req.user.id, req.body);
    res.status(201).json({ message: 'Loan application submitted successfully', application });
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Failed to submit loan application' });
  }
};

export const getMyLoans = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }
    const applications = await fintechService.getMyLoanApplications(req.user.id);
    res.status(200).json(applications);
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Failed to fetch loan applications' });
  }
};
