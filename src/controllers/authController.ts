import { Request, Response } from 'express';
import { AuthRequest } from '../types';
import * as authService from '../services/authService';

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, phone, password, role, farmName, region, city, cooperativeName, businessName, primaryMarketCity } = req.body;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({ message: 'Name, email, phone, and password are required' });
    }

    const result = await authService.registerUser({
      name,
      email,
      phone,
      password,
      role,
      farmName,
      region,
      city,
      cooperativeName,
      businessName,
      primaryMarketCity,
    });

    res.status(201).json(result);
  } catch (error: any) {
    console.error('Registration error:', error.message);
    res.status(400).json({ message: error.message || 'Registration failed' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email/Phone and password are required' });
    }

    const result = await authService.loginUser(email, password);
    res.json(result);
  } catch (error: any) {
    console.error('Login error:', error.message);
    res.status(401).json({ message: error.message || 'Invalid credentials' });
  }
};

export const me = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const profile = await authService.getCurrentUserProfile(req.user.id);
    res.json({ user: profile });
  } catch (error: any) {
    res.status(404).json({ message: error.message || 'User not found' });
  }
};
