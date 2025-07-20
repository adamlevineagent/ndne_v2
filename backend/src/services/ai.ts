import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

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

export interface ExtractedOutcome {
  statement: string;
  importance: number;
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
          model: 'moonshotai/kimi-k2',
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
          timeout: 180000 // 3 minute timeout for kimi-k2
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
   * Extract outcomes from conversation text
   */
  async extractOutcomes(conversationText: string): Promise<ExtractedOutcome[]> {
    try {
      const extractionPrompt: ChatMessage = {
        role: 'system',
        content: `Analyze this conversation text and extract any desired outcomes the user has expressed. 
Look for statements about what they want to see in the world, their values, and their vision for the future.

Return a JSON array of objects with this format:
{
  "statement": "I want a world where...",
  "importance": 1-5 (estimate based on how strongly they expressed it)
}

Guidelines:
- Convert statements to "I want a world where..." format
- Rate importance 1-5 based on emotional intensity and emphasis
- Only extract clear, actionable desired outcomes
- If no clear outcomes are found, return an empty array

Example: [{"statement": "I want a world where everyone has access to quality education", "importance": 4}]`
      };

      const userMessage: ChatMessage = {
        role: 'user',
        content: conversationText
      };

      const response = await AIService.chat([extractionPrompt, userMessage]);
      
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

  /**
   * Refine an outcome statement for clarity and specificity
   */
  async refineOutcome(outcomeStatement: string): Promise<string> {
    try {
      const refinementPrompt: ChatMessage = {
        role: 'system',
        content: `You are helping refine outcome statements to be clearer and more specific while preserving the original intent.

Guidelines:
- Keep the "I want a world where..." format
- Make it more specific and actionable if vague
- Improve clarity without changing the core meaning
- If the statement is already clear and specific, return it unchanged
- Focus on the desired end state, not the means to achieve it

Return only the refined statement, nothing else.`
      };

      const userMessage: ChatMessage = {
        role: 'user',
        content: `Please refine this outcome statement: "${outcomeStatement}"`
      };

      const response = await AIService.chat([refinementPrompt, userMessage]);
      return response.message.trim();
    } catch (error) {
      console.error('Outcome refinement error:', error);
      return outcomeStatement; // Return original if refinement fails
    }
  }
}