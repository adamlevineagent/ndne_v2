import { Router } from 'express';
import authRoutes from './auth';
import conversationRoutes from './conversations';
import outcomeRoutes from './outcomes';

const router = Router();

// Mount auth routes
router.use('/auth', authRoutes);

// Mount conversation routes
router.use('/conversations', conversationRoutes);

// Mount outcome routes
router.use('/outcomes', outcomeRoutes);

// Health check for API
router.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'NDNE V2 API'
  });
});

export default router;