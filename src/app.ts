import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import authRoutes from './routes/authRoutes';
import yieldRoutes from './routes/yieldRoutes';
import postRoutes from './routes/postRoutes';
import orderRoutes from './routes/orderRoutes';
import fintechRoutes from './routes/fintechRoutes';
import chatRoutes from './routes/chatRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors({ origin: '*' }));
app.use(express.json());

// API Health Check
app.get('/', (_req, res) => {
  res.json({
    name: 'AgroBazaar Cameroon Multi-Actor API',
    version: '2.0.0',
    status: 'ONLINE',
    time: new Date().toISOString(),
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/yields', yieldRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/fintech', fintechRoutes);
app.use('/api/chat', chatRoutes);

// Global Error Handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ message: err.message || 'Internal Server Error' });
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`🌱 AgroBazaar Server running on http://localhost:${PORT}`);
  });
}

export default app;
