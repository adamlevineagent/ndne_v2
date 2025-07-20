import { Pool } from 'pg';
import { AIService } from './ai';

export interface Outcome {
  id: string;
  userId: string;
  statement: string;
  importance: number;
  extractedFromConversation: boolean;
  refinementHistory: RefinementEntry[];
  createdAt: Date;
  updatedAt: Date;
}

export interface RefinementEntry {
  timestamp: Date;
  originalStatement: string;
  refinedStatement: string;
  reason: string;
}

export interface CreateOutcomeRequest {
  userId: string;
  statement: string;
  importance: number;
  extractedFromConversation?: boolean;
}

export interface UpdateOutcomeRequest {
  statement?: string;
  importance?: number;
}

export class OutcomeService {
  private db: Pool;
  private aiService: AIService;

  constructor(db: Pool, aiService: AIService) {
    this.db = db;
    this.aiService = aiService;
  }

  async createOutcome(request: CreateOutcomeRequest): Promise<Outcome> {
    const query = `
      INSERT INTO outcomes (user_id, statement, importance, extracted_from_conversation)
      VALUES ($1, $2, $3, $4)
      RETURNING id, user_id, statement, importance, extracted_from_conversation, 
                refinement_history, created_at, updated_at
    `;
    
    const values = [
      request.userId,
      request.statement,
      request.importance,
      request.extractedFromConversation || false
    ];

    const result = await this.db.query(query, values);
    return this.mapRowToOutcome(result.rows[0]);
  }

  async getOutcomesByUserId(userId: string): Promise<Outcome[]> {
    const query = `
      SELECT id, user_id, statement, importance, extracted_from_conversation,
             refinement_history, created_at, updated_at
      FROM outcomes
      WHERE user_id = $1
      ORDER BY created_at DESC
    `;

    const result = await this.db.query(query, [userId]);
    return result.rows.map(row => this.mapRowToOutcome(row));
  }

  async getOutcomeById(id: string): Promise<Outcome | null> {
    const query = `
      SELECT id, user_id, statement, importance, extracted_from_conversation,
             refinement_history, created_at, updated_at
      FROM outcomes
      WHERE id = $1
    `;

    const result = await this.db.query(query, [id]);
    if (result.rows.length === 0) {
      return null;
    }
    return this.mapRowToOutcome(result.rows[0]);
  }

  async updateOutcome(id: string, userId: string, updates: UpdateOutcomeRequest): Promise<Outcome | null> {
    const existingOutcome = await this.getOutcomeById(id);
    if (!existingOutcome || existingOutcome.userId !== userId) {
      return null;
    }

    const setParts: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (updates.statement !== undefined) {
      setParts.push(`statement = $${paramIndex++}`);
      values.push(updates.statement);
    }

    if (updates.importance !== undefined) {
      setParts.push(`importance = $${paramIndex++}`);
      values.push(updates.importance);
    }

    if (setParts.length === 0) {
      return existingOutcome;
    }

    const query = `
      UPDATE outcomes
      SET ${setParts.join(', ')}, updated_at = NOW()
      WHERE id = $${paramIndex} AND user_id = $${paramIndex + 1}
      RETURNING id, user_id, statement, importance, extracted_from_conversation,
                refinement_history, created_at, updated_at
    `;

    values.push(id, userId);
    const result = await this.db.query(query, values);
    
    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToOutcome(result.rows[0]);
  }

  async deleteOutcome(id: string, userId: string): Promise<boolean> {
    const query = `
      DELETE FROM outcomes
      WHERE id = $1 AND user_id = $2
    `;

    const result = await this.db.query(query, [id, userId]);
    return result.rowCount !== null && result.rowCount > 0;
  }

  async extractOutcomesFromConversation(userId: string, conversationMessages: any[]): Promise<Outcome[]> {
    try {
      const conversationText = conversationMessages
        .filter(msg => msg.role === 'user')
        .map(msg => msg.content)
        .join('\n');

      const extractedOutcomes = await this.aiService.extractOutcomes(conversationText);
      
      const createdOutcomes: Outcome[] = [];
      
      for (const extracted of extractedOutcomes) {
        const outcome = await this.createOutcome({
          userId,
          statement: extracted.statement,
          importance: extracted.importance,
          extractedFromConversation: true
        });
        createdOutcomes.push(outcome);
      }

      return createdOutcomes;
    } catch (error) {
      console.error('Error extracting outcomes from conversation:', error);
      throw new Error('Failed to extract outcomes from conversation');
    }
  }

  async refineOutcome(outcomeId: string, userId: string): Promise<Outcome | null> {
    const outcome = await this.getOutcomeById(outcomeId);
    if (!outcome || outcome.userId !== userId) {
      return null;
    }

    try {
      const refinedStatement = await this.aiService.refineOutcome(outcome.statement);
      
      if (refinedStatement === outcome.statement) {
        return outcome; // No refinement needed
      }

      const refinementEntry: RefinementEntry = {
        timestamp: new Date(),
        originalStatement: outcome.statement,
        refinedStatement,
        reason: 'AI-powered refinement for clarity and specificity'
      };

      const newRefinementHistory = [...outcome.refinementHistory, refinementEntry];

      const query = `
        UPDATE outcomes
        SET statement = $1, refinement_history = $2, updated_at = NOW()
        WHERE id = $3 AND user_id = $4
        RETURNING id, user_id, statement, importance, extracted_from_conversation,
                  refinement_history, created_at, updated_at
      `;

      const result = await this.db.query(query, [
        refinedStatement,
        JSON.stringify(newRefinementHistory),
        outcomeId,
        userId
      ]);

      if (result.rows.length === 0) {
        return null;
      }

      return this.mapRowToOutcome(result.rows[0]);
    } catch (error) {
      console.error('Error refining outcome:', error);
      throw new Error('Failed to refine outcome');
    }
  }

  private mapRowToOutcome(row: any): Outcome {
    return {
      id: row.id,
      userId: row.user_id,
      statement: row.statement,
      importance: row.importance,
      extractedFromConversation: row.extracted_from_conversation,
      refinementHistory: Array.isArray(row.refinement_history) 
        ? row.refinement_history 
        : [],
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}