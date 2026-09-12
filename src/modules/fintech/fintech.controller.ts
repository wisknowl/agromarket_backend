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

export const getCampaigns = async (_req: Request, res: Response): Promise<void> => {
  try {
    const campaigns = await fintechService.getAgroVestorCampaigns();
    res.status(200).json(campaigns);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to fetch campaigns' });
  }
};

export const createCampaign = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }
    const campaign = await fintechService.createAgroVestorCampaign(req.user.id, req.body);
    res.status(201).json({ message: 'AgroVestor campaign launched successfully', campaign });
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Failed to launch campaign' });
  }
};

export const investInCampaign = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }
    const investment = await fintechService.pledgeAgroVestorInvestment(req.user.id, req.body);
    res.status(201).json({ message: 'Investment pledged and secured in escrow', investment });
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Failed to pledge investment' });
  }
};

export const getMyInvestments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }
    const investments = await fintechService.getMyAgroVestments(req.user.id);
    res.status(200).json(investments);
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Failed to fetch investments' });
  }
};

export const patronizeFarmController = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }
    const subscription = await fintechService.patronizeFarm(req.user.id, req.body);
    res.status(201).json({ message: 'AgroPatron pass activated successfully', subscription });
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Failed to subscribe as AgroPatron' });
  }
};

export const getPatronStatusController = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }
    const status = await fintechService.getFarmPatronStatus(req.user.id, req.params.farmerId);
    res.status(200).json(status);
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Failed to check patron status' });
  }
};

export const getMyPatronagesController = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }
    const patronages = await fintechService.getMyPatronages(req.user.id);
    res.status(200).json(patronages);
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Failed to fetch active patronages' });
  }
};

