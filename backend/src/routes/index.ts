import { Router } from 'express';
import authRoutes from './auth';

const router = Router();

// Mount auth routes
router.use('/auth', authRoutes);

// Health check for API
router.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'NDNE V2 API'
  });
});

export default router;