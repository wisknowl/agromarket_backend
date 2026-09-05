import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import { authRoutes } from './modules/auth';
import { yieldRoutes } from './modules/yields';
import { postRoutes } from './modules/feed';
import { orderRoutes } from './modules/orders';
import { fintechRoutes } from './modules/fintech';
import { chatRoutes } from './modules/chat';
import { farmRoutes } from './modules/farms';
import { buyamSellamRoutes } from './modules/buyam-sellam';
import { adminRoutes } from './modules/admin';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors({ origin: '*' }));
app.use(express.json());

// Request Logger (Prints visited URLs & methods to CLI)
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    const color = res.statusCode >= 400 ? '\x1b[31m' : '\x1b[32m';
    console.log(`[API ${req.method}] ${req.originalUrl} -> ${color}${res.statusCode}\x1b[0m (${duration}ms)`);
  });
  next();
});

// API Health Check
app.get('/', (_req, res) => {
  res.json({
    name: 'AgroMarket (Agrom) Global Agri-Commerce API',
    version: '3.0.0 (Modular Domain Architecture)',
    status: 'ONLINE',
    time: new Date().toISOString(),
    modules: [
      'auth',
      'feed',
      'yields',
      'orders',
      'fintech',
      'chat',
      'farms',
      'buyam-sellam',
      'admin',
    ],
  });
});

// Domain Module Routes
app.use('/api/auth', authRoutes);
app.use('/api/yields', yieldRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/fintech', fintechRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/farms', farmRoutes);
app.use('/api/wholesaler', buyamSellamRoutes);
app.use('/api/admin', adminRoutes);

// Global Error Handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ message: err.message || 'Internal Server Error' });
});

if (process.env.NODE_ENV !== 'test') {
  const serverPort = Number(PORT) || 5000;
  app.listen(serverPort, '0.0.0.0', () => {
    console.log(`🌱 AgroMarket Modular Server running on http://0.0.0.0:${serverPort}`);
    console.log(`📡 Local Network Access: http://192.168.1.15:${serverPort}`);
    console.log(`📱 Android Emulator Access: http://10.0.2.2:${serverPort}`);
  });
}

export default app;
