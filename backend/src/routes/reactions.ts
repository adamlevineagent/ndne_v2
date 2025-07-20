import { Router, Request, Response } from 'express';
import { reactionService, CreateReactionData } from '../services/reaction';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// All reaction routes require authentication
router.use(authenticateToken);

/**
 * POST /api/reactions
 * Create or update a user's reaction to a proposal
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { proposalId, response, comment } = req.body;
    const userId = (req as any).user.userId;

    // Validate required fields
    if (!proposalId || !response) {
      return res.status(400).json({
        error: 'Missing required fields: proposalId and response are required'
      });
    }

    // Validate response value
    if (!['like', 'dislike'].includes(response)) {
      return res.status(400).json({
        error: 'Invalid response value. Must be "like" or "dislike"'
      });
    }

    const reactionData: CreateReactionData = {
      userId,
      proposalId,
      response,
      comment: comment || undefined
    };

    const reaction = await reactionService.createOrUpdateReaction(reactionData);

    res.status(201).json({
      success: true,
      data: reaction
    });
  } catch (error) {
    console.error('Error creating/updating reaction:', error);
    res.status(500).json({
      error: 'Failed to create or update reaction'
    });
  }
});

/**
 * GET /api/reactions/:proposalId
 * Get all reactions for a specific proposal
 */
router.get('/:proposalId', async (req: Request, res: Response) => {
  try {
    const { proposalId } = req.params;

    if (!proposalId) {
      return res.status(400).json({
        error: 'Proposal ID is required'
      });
    }

    const reactions = await reactionService.getReactionsByProposal(proposalId);
    const stats = await reactionService.getReactionStats(proposalId);

    res.json({
      success: true,
      data: {
        reactions,
        stats
      }
    });
  } catch (error) {
    console.error('Error fetching reactions:', error);
    res.status(500).json({
      error: 'Failed to fetch reactions'
    });
  }
});

/**
 * GET /api/reactions/:proposalId/user
 * Get the current user's reaction to a specific proposal
 */
router.get('/:proposalId/user', async (req: Request, res: Response) => {
  try {
    const { proposalId } = req.params;
    const userId = (req as any).user.userId;

    if (!proposalId) {
      return res.status(400).json({
        error: 'Proposal ID is required'
      });
    }

    const reaction = await reactionService.getUserReaction(userId, proposalId);

    res.json({
      success: true,
      data: reaction
    });
  } catch (error) {
    console.error('Error fetching user reaction:', error);
    res.status(500).json({
      error: 'Failed to fetch user reaction'
    });
  }
});

/**
 * DELETE /api/reactions/:proposalId
 * Delete the current user's reaction to a proposal
 */
router.delete('/:proposalId', async (req: Request, res: Response) => {
  try {
    const { proposalId } = req.params;
    const userId = (req as any).user.userId;

    if (!proposalId) {
      return res.status(400).json({
        error: 'Proposal ID is required'
      });
    }

    const deleted = await reactionService.deleteReaction(userId, proposalId);

    if (!deleted) {
      return res.status(404).json({
        error: 'Reaction not found'
      });
    }

    res.json({
      success: true,
      message: 'Reaction deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting reaction:', error);
    res.status(500).json({
      error: 'Failed to delete reaction'
    });
  }
});

/**
 * GET /api/reactions/user/all
 * Get all reactions by the current user
 */
router.get('/user/all', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;

    const reactions = await reactionService.getUserReactions(userId);

    res.json({
      success: true,
      data: reactions
    });
  } catch (error) {
    console.error('Error fetching user reactions:', error);
    res.status(500).json({
      error: 'Failed to fetch user reactions'
    });
  }
});

export default router;