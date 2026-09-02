import { Request } from 'express';
import { UserRole } from '@prisma/client';

export interface AuthUserPayload {
  id: string;
  email: string;
  role: UserRole;
  name: string;
}

export interface AuthRequest extends Request {
  user?: AuthUserPayload;
}
