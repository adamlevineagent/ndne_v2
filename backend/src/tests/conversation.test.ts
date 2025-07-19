import { ConversationService } from '../services/conversation';
import { AuthService } from '../services/auth';
import pool from '../config/database';

// Mock the AI service to avoid external API calls during testing
jest.mock('../services/ai', () => ({
  AIService: {
    chat: jest.fn().mockResolvedValue({
      message: 'Hello! I\'m your Home Mind AI. I\'d love to learn about your desired outcomes for the world.',
      usage: { total_tokens: 50 }
    })
  }
}));

describe('ConversationService', () => {
  let testUserId: string;

  beforeAll(async () => {
    // Create a test user
    const { user } = await AuthService.register('test@example.com', 'testpassword123');
    testUserId = user.id;
  });

  afterAll(async () => {
    // Clean up test data
    await pool.query('DELETE FROM conversations WHERE user_id = $1', [testUserId]);
    await pool.query('DELETE FROM users WHERE id = $1', [testUserId]);
  });

  describe('createConversation', () => {
    it('should create a new conversation with AI response', async () => {
      const initialMessage = 'I want a world where everyone has access to clean water';
      
      const conversation = await ConversationService.createConversation(testUserId, initialMessage);
      
      expect(conversation).toBeDefined();
      expect(conversation.user_id).toBe(testUserId);
      expect(conversation.messages).toHaveLength(2);
      expect(conversation.messages[0].role).toBe('user');
      expect(conversation.messages[0].content).toBe(initialMessage);
      expect(conversation.messages[1].role).toBe('assistant');
      expect(conversation.messages[1].content).toContain('Home Mind');
    });
  });

  describe('getUserConversations', () => {
    it('should retrieve user conversations', async () => {
      const conversations = await ConversationService.getUserConversations(testUserId);
      
      expect(Array.isArray(conversations)).toBe(true);
      expect(conversations.length).toBeGreaterThan(0);
      expect(conversations[0].user_id).toBe(testUserId);
    });
  });

  describe('addMessage', () => {
    it('should add a message to existing conversation', async () => {
      // First create a conversation
      const initialConversation = await ConversationService.createConversation(
        testUserId, 
        'Tell me about environmental issues'
      );
      
      // Add a message
      const updatedConversation = await ConversationService.addMessage(
        initialConversation.id,
        testUserId,
        'What can individuals do to help?'
      );
      
      expect(updatedConversation.messages).toHaveLength(4); // 2 initial + 2 new
      expect(updatedConversation.messages[2].role).toBe('user');
      expect(updatedConversation.messages[2].content).toBe('What can individuals do to help?');
      expect(updatedConversation.messages[3].role).toBe('assistant');
    });
  });
});