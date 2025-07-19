import axios from 'axios';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const PLATFORM_API_KEY = process.env.OPENROUTER_API_KEY;

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatResponse {
  message: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class AIService {
  /**
   * Send a chat message to OpenRouter API
   */
  static async chat(
    messages: ChatMessage[],
    userApiKey?: string
  ): Promise<ChatResponse> {
    try {
      const apiKey = userApiKey || PLATFORM_API_KEY;
      
      if (!apiKey) {
        throw new Error('No API key available for AI service');
      }

      // Add system prompt for Home Mind persona
      const systemPrompt: ChatMessage = {
        role: 'system',
        content: `You are the user's Home Mind AI assistant. Your role is to:
1. Learn about the user's desired outcomes for the world through natural conversation
2. Help them articulate what they want to see happen (not what they oppose)
3. Ask thoughtful questions to understand their values and priorities
4. Be supportive, curious, and focused on understanding their vision for a better world
5. Keep conversations focused on outcomes rather than positions or policies

Remember: You're learning what the user wants the world to look like, not debating politics or taking sides.`
      };

      const fullMessages = [systemPrompt, ...messages];

      const response = await axios.post(
        OPENROUTER_API_URL,
        {
          model: 'anthropic/claude-3-haiku',
          messages: fullMessages,
          max_tokens: 1000,
          temperature: 0.7
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': process.env.CORS_ORIGIN || 'http://localhost:3001',
            'X-Title': 'NDNE V2 Platform'
          },
          timeout: 30000 // 30 second timeout
        }
      );

      const choice = response.data.choices?.[0];
      if (!choice || !choice.message) {
        throw new Error('Invalid response from AI service');
      }

      return {
        message: choice.message.content,
        usage: response.data.usage
      };

    } catch (error: any) {
      console.error('AI Service error:', error.response?.data || error.message);
      
      if (error.response?.status === 401) {
        throw new Error('Invalid API key for AI service');
      } else if (error.response?.status === 429) {
        throw new Error('AI service rate limit exceeded. Please try again later.');
      } else if (error.code === 'ECONNABORTED') {
        throw new Error('AI service request timed out. Please try again.');
      }
      
      throw new Error('AI service temporarily unavailable. Please try again later.');
    }
  }

  /**
   * Extract outcomes from conversation history
   */
  static async extractOutcomes(messages: ChatMessage[]): Promise<string[]> {
    try {
      const extractionPrompt: ChatMessage = {
        role: 'system',
        content: `Analyze this conversation and extract any desired outcomes the user has expressed. 
Look for statements about what they want to see in the world, their values, and their vision for the future.
Return a JSON array of outcome statements. Each should be a clear "I want a world where..." statement.
If no clear outcomes are found, return an empty array.

Example format: ["I want a world where everyone has access to quality education", "I want a world where communities are more connected"]`
      };

      const response = await this.chat([extractionPrompt, ...messages]);
      
      try {
        const outcomes = JSON.parse(response.message);
        return Array.isArray(outcomes) ? outcomes : [];
      } catch {
        // If JSON parsing fails, return empty array
        return [];
      }
    } catch (error) {
      console.error('Outcome extraction error:', error);
      return [];
    }
  }
}