import { Response } from 'express';
import * as orderService from './order.service';
import { AuthRequest } from '../../core/types';

export const checkout = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }
    const order = await orderService.createEscrowOrder(req.user.id, req.body);
    res.status(201).json({ message: 'Order created with Escrow lock', order });
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Checkout failed' });
  }
};

export const getMyOrders = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }
    const orders = await orderService.getBuyerOrders(req.user.id);
    res.status(200).json(orders);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to fetch orders' });
  }
};

export const getOrder = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }
    const order = await orderService.getOrderById(req.params.id, req.user.id);
    res.status(200).json(order);
  } catch (error: any) {
    res.status(404).json({ message: error.message || 'Order not found' });
  }
};

export const getFarmerSales = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }
    const sales = await orderService.getFarmerOrders(req.user.id);
    res.status(200).json(sales);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to fetch sales' });
  }
};

export const releaseEscrow = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }
    const result = await orderService.releaseEscrowFunds(req.params.id, req.user.id);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Escrow release failed' });
  }
};

export const updateStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }
    const { status } = req.body;
    const order = await orderService.updateOrderStatus(req.params.id, status, req.user.id);
    res.status(200).json({ message: 'Order status updated', order });
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Failed to update order status' });
  }
};

export const checkPaymentStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await orderService.checkOrderPaymentStatus(req.params.id);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(404).json({ message: error.message || 'Payment status check failed' });
  }
};

export const campayWebhookHandler = async (req: any, res: Response): Promise<void> => {
  try {
    await orderService.handleCampayWebhook(req.body);
    res.status(200).json({ received: true });
  } catch (error: any) {
    console.error('Campay webhook error:', error);
    res.status(500).json({ message: 'Webhook error' });
  }
};


