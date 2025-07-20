import express, { Request, Response } from 'express';
import { learningService } from '../services';
import { authenticateToken } from '../middleware/auth';
import pool from '../config/database';

const router = express.Router();

/**
 * Analyze user's reaction patterns to extract learning insights
 */
router.post('/analyze-patterns', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const insights = await learningService.analyzeUserReactionPatterns(userId);
    
    res.json({
      success: true,
      insights,
      message: `Found ${insights.length} learning insights from your reaction patterns`
    });
  } catch (error: any) {
    console.error('Error analyzing reaction patterns:', error);
    res.status(500).json({ 
      error: 'Failed to analyze reaction patterns',
      details: error.message 
    });
  }
});

/**
 * Evolve user's outcomes based on learning insights
 */
router.post('/evolve-outcomes', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const evolutions = await learningService.evolveUserOutcomes(userId);
    
    res.json({
      success: true,
      evolutions,
      message: `Applied ${evolutions.length} outcome evolutions based on your preferences`
    });
  } catch (error: any) {
    console.error('Error evolving outcomes:', error);
    res.status(500).json({ 
      error: 'Failed to evolve outcomes',
      details: error.message 
    });
  }
});

/**
 * Get user's value profile
 */
router.get('/value-profile', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const profile = await learningService.buildUserValueProfile(userId);
    
    if (!profile) {
      return res.json({
        success: true,
        profile: null,
        message: 'Not enough data to build value profile yet. Create outcomes and react to proposals to build your profile.'
      });
    }

    res.json({
      success: true,
      profile,
      message: 'Value profile built from your outcomes and reactions'
    });
  } catch (error: any) {
    console.error('Error getting value profile:', error);
    res.status(500).json({ 
      error: 'Failed to get value profile',
      details: error.message 
    });
  }
});

/**
 * Get collective patterns (anonymized insights across all users)
 */
router.get('/collective-patterns', authenticateToken, async (req: Request, res: Response) => {
  try {
    const patterns = await learningService.identifyCollectivePatterns();
    
    res.json({
      success: true,
      patterns,
      message: `Found ${patterns.length} collective patterns from community reactions`
    });
  } catch (error: any) {
    console.error('Error getting collective patterns:', error);
    res.status(500).json({ 
      error: 'Failed to get collective patterns',
      details: error.message 
    });
  }
});

/**
 * Trigger learning analysis for a user (manual trigger for testing)
 */
router.post('/trigger-learning', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Analyze patterns
    const insights = await learningService.analyzeUserReactionPatterns(userId);
    
    // Evolve outcomes if insights found
    let evolutions = [];
    if (insights.length > 0) {
      evolutions = await learningService.evolveUserOutcomes(userId);
    }
    
    // Update value profile
    const profile = await learningService.buildUserValueProfile(userId);

    res.json({
      success: true,
      results: {
        insights: insights.length,
        evolutions: evolutions.length,
        profileUpdated: !!profile
      },
      message: 'Learning analysis completed'
    });
  } catch (error: any) {
    console.error('Error triggering learning:', error);
    res.status(500).json({ 
      error: 'Failed to trigger learning analysis',
      details: error.message 
    });
  }
});

/**
 * Get learning insights for a user
 */
router.get('/insights', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // This is a private method, so we'll need to expose it or create a public version
    // For now, let's create a simple query to get insights
    const query = `
      SELECT id, type, insight, confidence, created_at
      FROM learning_insights
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 20
    `;

    const result = await pool.query(query, [userId]);
    const insights = result.rows;

    res.json({
      success: true,
      insights,
      message: `Found ${insights.length} learning insights`
    });
  } catch (error: any) {
    console.error('Error getting learning insights:', error);
    res.status(500).json({ 
      error: 'Failed to get learning insights',
      details: error.message 
    });
  }
});

export default router;