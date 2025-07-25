import { Router, Request, Response } from 'express';
import { ProposalService, GenerateProposalRequest } from '../services/proposal';
import { authenticateToken } from '../middleware/auth';
import pool from '../config/database';

const router = Router();
const proposalService = new ProposalService(pool);

/**
 * POST /api/proposals/generate
 * Generate new proposals based on outcome similarity analysis
 */
router.post('/generate', authenticateToken, async (req: Request, res: Response) => {
  try {
    const generateRequest: GenerateProposalRequest = {
      minSimilarityScore: req.body.minSimilarityScore || 0.6,
      maxUsers: req.body.maxUsers || 10,
      focusThemes: req.body.focusThemes || []
    };

    const proposals = await proposalService.generateProposals(generateRequest);

    res.json({
      success: true,
      data: {
        proposals,
        count: proposals.length
      },
      message: `Generated ${proposals.length} proposals`
    });
  } catch (error: any) {
    console.error('Error generating proposals:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate proposals'
    });
  }
});

/**
 * GET /api/proposals
 * Get all proposals
 */
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const proposals = await proposalService.getAllProposals();

    res.json({
      success: true,
      data: {
        proposals,
        count: proposals.length
      }
    });
  } catch (error: any) {
    console.error('Error fetching proposals:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch proposals'
    });
  }
});

/**
 * GET /api/proposals/:id
 * Get a specific proposal by ID
 */
router.get('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const proposal = await proposalService.getProposalById(id);

    if (!proposal) {
      return res.status(404).json({
        success: false,
        error: 'Proposal not found'
      });
    }

    res.json({
      success: true,
      data: { proposal }
    });
  } catch (error: any) {
    console.error('Error fetching proposal:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch proposal'
    });
  }
});

/**
 * GET /api/proposals/:id/connections/:userId
 * Get how a specific proposal connects to a user's outcomes
 */
router.get('/:id/connections/:userId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id: proposalId, userId } = req.params;
    const requestingUserId = (req as any).user.userId;

    // Users can only access their own outcome connections
    if (userId !== requestingUserId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    const connections = await proposalService.getProposalOutcomeConnections(proposalId, userId);

    if (!connections) {
      return res.status(404).json({
        success: false,
        error: 'Proposal not found or no connections available'
      });
    }

    res.json({
      success: true,
      data: { connections }
    });
  } catch (error: any) {
    console.error('Error fetching proposal connections:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch proposal connections'
    });
  }
});

export default router;