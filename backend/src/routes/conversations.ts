import { Router, Response } from 'express';
import { ConversationService } from '../services/conversation';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

/**
 * Get all conversations for the authenticated user
 * GET /api/conversations
 */
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const conversations = await ConversationService.getUserConversations(req.user.userId);

    res.json({
      conversations: conversations.map(conv => ({
        id: conv.id,
        messages: conv.messages,
        createdAt: conv.created_at
      }))
    });

  } catch (error: any) {
    console.error('Get conversations error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch conversations' 
    });
  }
});

/**
 * Get a specific conversation by ID
 * GET /api/conversations/:id
 */
router.get('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { id } = req.params;
    const conversation = await ConversationService.getConversationById(id, req.user.userId);

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    res.json({
      conversation: {
        id: conversation.id,
        messages: conversation.messages,
        createdAt: conversation.created_at
      }
    });

  } catch (error: any) {
    console.error('Get conversation error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch conversation' 
    });
  }
});

/**
 * Create a new conversation
 * POST /api/conversations
 */
router.post('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { message } = req.body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ 
        error: 'Message is required and must be a non-empty string' 
      });
    }

    if (message.length > 2000) {
      return res.status(400).json({ 
        error: 'Message is too long (maximum 2000 characters)' 
      });
    }

    const conversation = await ConversationService.createConversation(
      req.user.userId, 
      message.trim()
    );

    res.status(201).json({
      message: 'Conversation created successfully',
      conversation: {
        id: conversation.id,
        messages: conversation.messages,
        createdAt: conversation.created_at
      }
    });

  } catch (error: any) {
    console.error('Create conversation error:', error);
    
    if (error.message.includes('API key')) {
      return res.status(503).json({ 
        error: 'AI service is temporarily unavailable. Please try again later.' 
      });
    }

    res.status(500).json({ 
      error: 'Failed to create conversation' 
    });
  }
});

/**
 * Add a message to an existing conversation
 * POST /api/conversations/:id/messages
 */
router.post('/:id/messages', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { id } = req.params;
    const { message } = req.body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ 
        error: 'Message is required and must be a non-empty string' 
      });
    }

    if (message.length > 2000) {
      return res.status(400).json({ 
        error: 'Message is too long (maximum 2000 characters)' 
      });
    }

    const conversation = await ConversationService.addMessage(
      id, 
      req.user.userId, 
      message.trim()
    );

    res.json({
      message: 'Message added successfully',
      conversation: {
        id: conversation.id,
        messages: conversation.messages,
        createdAt: conversation.created_at
      }
    });

  } catch (error: any) {
    console.error('Add message error:', error);
    
    if (error.message === 'Conversation not found') {
      return res.status(404).json({ error: error.message });
    }

    if (error.message.includes('API key')) {
      return res.status(503).json({ 
        error: 'AI service is temporarily unavailable. Please try again later.' 
      });
    }

    res.status(500).json({ 
      error: 'Failed to add message to conversation' 
    });
  }
});

/**
 * Delete a conversation
 * DELETE /api/conversations/:id
 */
router.delete('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { id } = req.params;
    const deleted = await ConversationService.deleteConversation(id, req.user.userId);

    if (!deleted) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    res.json({
      message: 'Conversation deleted successfully'
    });

  } catch (error: any) {
    console.error('Delete conversation error:', error);
    res.status(500).json({ 
      error: 'Failed to delete conversation' 
    });
  }
});

export default router;