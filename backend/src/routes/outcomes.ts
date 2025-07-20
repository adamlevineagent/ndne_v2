import { Router, Request, Response } from 'express';
import { Pool } from 'pg';
import { OutcomeService, CreateOutcomeRequest, UpdateOutcomeRequest } from '../services/outcome';
import { AIService } from '../services/ai';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Initialize services (will be properly injected in production)
let outcomeService: OutcomeService;

// Middleware to initialize services
router.use((req: any, res, next) => {
  if (!outcomeService) {
    const db = req.app.locals.db as Pool;
    const aiService = new AIService();
    outcomeService = new OutcomeService(db, aiService);
  }
  next();
});

// GET /api/outcomes/:userId - Get all outcomes for a user
router.get('/:userId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const requestingUserId = (req as any).user.userId;

    // Users can only access their own outcomes
    if (userId !== requestingUserId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const outcomes = await outcomeService.getOutcomesByUserId(userId);
    res.json({ outcomes });
  } catch (error) {
    console.error('Error fetching outcomes:', error);
    res.status(500).json({ error: 'Failed to fetch outcomes' });
  }
});

// POST /api/outcomes - Create a new outcome
router.post('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { statement, importance } = req.body;

    if (!statement || typeof statement !== 'string') {
      return res.status(400).json({ error: 'Statement is required and must be a string' });
    }

    if (importance !== undefined && (typeof importance !== 'number' || importance < 1 || importance > 5)) {
      return res.status(400).json({ error: 'Importance must be a number between 1 and 5' });
    }

    const createRequest: CreateOutcomeRequest = {
      userId,
      statement: statement.trim(),
      importance: importance || 3,
      extractedFromConversation: false
    };

    const outcome = await outcomeService.createOutcome(createRequest);
    res.status(201).json({ outcome });
  } catch (error) {
    console.error('Error creating outcome:', error);
    res.status(500).json({ error: 'Failed to create outcome' });
  }
});

// PUT /api/outcomes/:id - Update an outcome
router.put('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.userId;
    const { statement, importance } = req.body;

    const updates: UpdateOutcomeRequest = {};

    if (statement !== undefined) {
      if (typeof statement !== 'string') {
        return res.status(400).json({ error: 'Statement must be a string' });
      }
      updates.statement = statement.trim();
    }

    if (importance !== undefined) {
      if (typeof importance !== 'number' || importance < 1 || importance > 5) {
        return res.status(400).json({ error: 'Importance must be a number between 1 and 5' });
      }
      updates.importance = importance;
    }

    const outcome = await outcomeService.updateOutcome(id, userId, updates);
    
    if (!outcome) {
      return res.status(404).json({ error: 'Outcome not found or access denied' });
    }

    res.json({ outcome });
  } catch (error) {
    console.error('Error updating outcome:', error);
    res.status(500).json({ error: 'Failed to update outcome' });
  }
});

// DELETE /api/outcomes/:id - Delete an outcome
router.delete('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.userId;

    const deleted = await outcomeService.deleteOutcome(id, userId);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Outcome not found or access denied' });
    }

    res.json({ message: 'Outcome deleted successfully' });
  } catch (error) {
    console.error('Error deleting outcome:', error);
    res.status(500).json({ error: 'Failed to delete outcome' });
  }
});

// POST /api/outcomes/extract - Extract outcomes from conversation
router.post('/extract', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { conversationMessages } = req.body;

    if (!Array.isArray(conversationMessages)) {
      return res.status(400).json({ error: 'conversationMessages must be an array' });
    }

    const outcomes = await outcomeService.extractOutcomesFromConversation(userId, conversationMessages);
    res.json({ outcomes });
  } catch (error) {
    console.error('Error extracting outcomes:', error);
    res.status(500).json({ error: 'Failed to extract outcomes from conversation' });
  }
});

// POST /api/outcomes/:id/refine - Refine an outcome using AI
router.post('/:id/refine', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.userId;

    const outcome = await outcomeService.refineOutcome(id, userId);
    
    if (!outcome) {
      return res.status(404).json({ error: 'Outcome not found or access denied' });
    }

    res.json({ outcome });
  } catch (error) {
    console.error('Error refining outcome:', error);
    res.status(500).json({ error: 'Failed to refine outcome' });
  }
});

export default router;