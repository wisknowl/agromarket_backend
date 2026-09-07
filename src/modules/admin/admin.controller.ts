import { Request, Response } from 'express';
import * as adminService from './admin.service';

export const getFlags = async (_req: Request, res: Response): Promise<void> => {
  try {
    const flags = await adminService.getFeatureFlags();
    res.status(200).json(flags);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to fetch feature flags' });
  }
};

export const setFlag = async (req: Request, res: Response): Promise<void> => {
  try {
    const { flagName, isEnabled } = req.body;
    if (!flagName || typeof isEnabled !== 'boolean') {
      res.status(400).json({ message: 'flagName (string) and isEnabled (boolean) are required' });
      return;
    }
    const updated = await adminService.updateFeatureFlag(flagName, isEnabled);
    res.status(200).json({ message: `Flag ${flagName} set to ${isEnabled}`, flags: updated });
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Failed to update feature flag' });
  }
};

export const getOverviewStats = async (_req: Request, res: Response): Promise<void> => {
  try {
    const stats = await adminService.getPlatformStats();
    res.status(200).json(stats);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to fetch platform stats' });
  }
};

export const getUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { role, search } = req.query as { role?: string; search?: string };
    const users = await adminService.getAdminUsers({ role, search });
    res.status(200).json(users);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to fetch users' });
  }
};

export const updateUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const updated = await adminService.updateUserByAdmin(req.params.id, req.body);
    res.status(200).json({ message: 'User updated successfully', user: updated });
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Failed to update user' });
  }
};

export const verifyUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { isVerified } = req.body;
    const user = await adminService.toggleUserVerification(req.params.id, isVerified);
    res.status(200).json({ message: 'User verification updated', user });
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Failed to update user verification' });
  }
};

export const setFarmerTier = async (req: Request, res: Response): Promise<void> => {
  try {
    const { tier } = req.body;
    if (!tier) {
      res.status(400).json({ message: 'tier is required (BRONZE, SILVER, GOLD, PLATINUM)' });
      return;
    }
    const farmer = await adminService.updateFarmerTier(req.params.id, tier);
    res.status(200).json({ message: 'Farmer tier updated', farmer });
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Failed to update farmer tier' });
  }
};

export const getFarms = async (_req: Request, res: Response): Promise<void> => {
  try {
    const farms = await adminService.getAdminFarms();
    res.status(200).json(farms);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to fetch farms' });
  }
};

export const verifyFarm = async (req: Request, res: Response): Promise<void> => {
  try {
    const { isVerified } = req.body;
    const farm = await adminService.toggleFarmVerification(req.params.id, isVerified);
    res.status(200).json({ message: 'Farm verification updated', farm });
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Failed to update farm verification' });
  }
};

export const getLoans = async (_req: Request, res: Response): Promise<void> => {
  try {
    const loans = await adminService.getAdminLoans();
    res.status(200).json(loans);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to fetch loans' });
  }
};

export const getFinancialInstitutions = async (_req: Request, res: Response): Promise<void> => {
  try {
    const institutions = await adminService.getAdminFinancialInstitutions();
    res.status(200).json(institutions);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to fetch financial institutions' });
  }
};

export const setLoanStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status } = req.body;
    const loan = await adminService.updateLoanStatus(req.params.id, status);
    res.status(200).json({ message: 'Loan status updated', loan });
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Failed to update loan status' });
  }
};

export const getDisputes = async (_req: Request, res: Response): Promise<void> => {
  try {
    const disputes = await adminService.getDisputedOrders();
    res.status(200).json(disputes);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to fetch disputes' });
  }
};

export const resolveDisputeOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const { resolution, reason } = req.body;
    const result = await adminService.resolveDispute(req.params.id, resolution, reason);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Dispute resolution failed' });
  }
};
