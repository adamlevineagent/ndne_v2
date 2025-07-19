import pool from '../config/database';
import { AIService, ChatMessage } from './ai';

export interface Conversation {
  id: string;
  user_id: string;
  messages: ChatMessage[];
  created_at: Date;
}

export class ConversationService {
  /**
   * Get all conversations for a user
   */
  static async getUserConversations(userId: string): Promise<Conversation[]> {
    try {
      const result = await pool.query(
        'SELECT * FROM conversations WHERE user_id = $1 ORDER BY created_at DESC',
        [userId]
      );

      return result.rows;
    } catch (error) {
      console.error('Error fetching user conversations:', error);
      throw new Error('Failed to fetch conversations');
    }
  }

  /**
   * Get a specific conversation by ID
   */
  static async getConversationById(conversationId: string, userId: string): Promise<Conversation | null> {
    try {
      const result = await pool.query(
        'SELECT * FROM conversations WHERE id = $1 AND user_id = $2',
        [conversationId, userId]
      );

      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      console.error('Error fetching conversation:', error);
      throw new Error('Failed to fetch conversation');
    }
  }

  /**
   * Create a new conversation
   */
  static async createConversation(userId: string, initialMessage: string): Promise<Conversation> {
    try {
      // Get user's API key if they have one
      const userResult = await pool.query(
        'SELECT api_key FROM users WHERE id = $1',
        [userId]
      );
      
      const userApiKey = userResult.rows[0]?.api_key;

      // Create initial messages array
      const userMessage: ChatMessage = {
        role: 'user',
        content: initialMessage
      };

      // Get AI response
      const aiResponse = await AIService.chat([userMessage], userApiKey);
      
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: aiResponse.message
      };

      const messages = [userMessage, assistantMessage];

      // Store conversation in database
      const result = await pool.query(
        'INSERT INTO conversations (user_id, messages) VALUES ($1, $2) RETURNING *',
        [userId, JSON.stringify(messages)]
      );

      return result.rows[0];
    } catch (error) {
      console.error('Error creating conversation:', error);
      throw new Error('Failed to create conversation');
    }
  }

  /**
   * Add a message to an existing conversation
   */
  static async addMessage(
    conversationId: string, 
    userId: string, 
    message: string
  ): Promise<Conversation> {
    try {
      // Get existing conversation
      const conversation = await this.getConversationById(conversationId, userId);
      if (!conversation) {
        throw new Error('Conversation not found');
      }

      // Get user's API key if they have one
      const userResult = await pool.query(
        'SELECT api_key FROM users WHERE id = $1',
        [userId]
      );
      
      const userApiKey = userResult.rows[0]?.api_key;

      // Add user message
      const userMessage: ChatMessage = {
        role: 'user',
        content: message
      };

      const updatedMessages = [...conversation.messages, userMessage];

      // Get AI response
      const aiResponse = await AIService.chat(updatedMessages, userApiKey);
      
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: aiResponse.message
      };

      const finalMessages = [...updatedMessages, assistantMessage];

      // Update conversation in database
      const result = await pool.query(
        'UPDATE conversations SET messages = $1 WHERE id = $2 AND user_id = $3 RETURNING *',
        [JSON.stringify(finalMessages), conversationId, userId]
      );

      return result.rows[0];
    } catch (error) {
      console.error('Error adding message to conversation:', error);
      throw new Error('Failed to add message to conversation');
    }
  }

  /**
   * Delete a conversation
   */
  static async deleteConversation(conversationId: string, userId: string): Promise<boolean> {
    try {
      const result = await pool.query(
        'DELETE FROM conversations WHERE id = $1 AND user_id = $2',
        [conversationId, userId]
      );

      return (result.rowCount || 0) > 0;
    } catch (error) {
      console.error('Error deleting conversation:', error);
      throw new Error('Failed to delete conversation');
    }
  }
}