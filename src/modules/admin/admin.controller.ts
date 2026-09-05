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

export const getOverviewStats = async (_req: Request, res: Response): Promise<void> => {
  try {
    const stats = await adminService.getPlatformStats();
    res.status(200).json(stats);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to fetch platform stats' });
  }
};
