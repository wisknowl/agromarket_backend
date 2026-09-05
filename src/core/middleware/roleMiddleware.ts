import { Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';
import { AuthRequest } from '../types';

export const requireRole = (allowedRoles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    if (!allowedRoles.includes(req.user.role) && req.user.role !== UserRole.ADMIN) {
      res.status(403).json({
        message: `Forbidden: Requires one of [${allowedRoles.join(', ')}] role privileges`,
      });
      return;
    }

    next();
  };
};
