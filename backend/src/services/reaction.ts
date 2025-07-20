import { Pool } from 'pg';
import pool from '../config/database';

export interface Reaction {
  id: string;
  userId: string;
  proposalId: string;
  response: 'like' | 'dislike';
  comment?: string;
  createdAt: Date;
}

export interface CreateReactionData {
  userId: string;
  proposalId: string;
  response: 'like' | 'dislike';
  comment?: string;
}

export class ReactionService {
  private db: Pool;
  private learningService?: any; // Will be injected to avoid circular dependency

  constructor() {
    this.db = pool;
  }

  /**
   * Set learning service for reaction-based learning (injected to avoid circular dependency)
   */
  setLearningService(learningService: any): void {
    this.learningService = learningService;
  }

  /**
   * Create or update a user's reaction to a proposal
   */
  async createOrUpdateReaction(data: CreateReactionData): Promise<Reaction> {
    const { userId, proposalId, response, comment } = data;

    const query = `
      INSERT INTO reactions (user_id, proposal_id, response, comment)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (user_id, proposal_id)
      DO UPDATE SET 
        response = EXCLUDED.response,
        comment = EXCLUDED.comment,
        created_at = NOW()
      RETURNING id, user_id as "userId", proposal_id as "proposalId", response, comment, created_at as "createdAt"
    `;

    const result = await this.db.query(query, [userId, proposalId, response, comment]);
    const reaction = result.rows[0];

    // Trigger learning analysis asynchronously (don't wait for it to complete)
    if (this.learningService && reaction) {
      this.learningService.processNewReaction(userId, reaction.id).catch((error: any) => {
        console.error('Error processing reaction for learning:', error);
      });
    }

    return reaction;
  }

  /**
   * Get all reactions for a specific proposal
   */
  async getReactionsByProposal(proposalId: string): Promise<Reaction[]> {
    const query = `
      SELECT 
        id, 
        user_id as "userId", 
        proposal_id as "proposalId", 
        response, 
        comment, 
        created_at as "createdAt"
      FROM reactions 
      WHERE proposal_id = $1
      ORDER BY created_at DESC
    `;

    const result = await this.db.query(query, [proposalId]);
    return result.rows;
  }

  /**
   * Get a user's reaction to a specific proposal
   */
  async getUserReaction(userId: string, proposalId: string): Promise<Reaction | null> {
    const query = `
      SELECT 
        id, 
        user_id as "userId", 
        proposal_id as "proposalId", 
        response, 
        comment, 
        created_at as "createdAt"
      FROM reactions 
      WHERE user_id = $1 AND proposal_id = $2
    `;

    const result = await this.db.query(query, [userId, proposalId]);
    return result.rows[0] || null;
  }

  /**
   * Get reaction statistics for a proposal
   */
  async getReactionStats(proposalId: string): Promise<{
    totalReactions: number;
    likes: number;
    dislikes: number;
    likePercentage: number;
  }> {
    const query = `
      SELECT 
        COUNT(*) as total_reactions,
        COUNT(CASE WHEN response = 'like' THEN 1 END) as likes,
        COUNT(CASE WHEN response = 'dislike' THEN 1 END) as dislikes
      FROM reactions 
      WHERE proposal_id = $1
    `;

    const result = await this.db.query(query, [proposalId]);
    const { total_reactions, likes, dislikes } = result.rows[0];

    const totalReactions = parseInt(total_reactions);
    const likeCount = parseInt(likes);
    const dislikeCount = parseInt(dislikes);
    const likePercentage = totalReactions > 0 ? Math.round((likeCount / totalReactions) * 100) : 0;

    return {
      totalReactions,
      likes: likeCount,
      dislikes: dislikeCount,
      likePercentage
    };
  }

  /**
   * Delete a user's reaction to a proposal
   */
  async deleteReaction(userId: string, proposalId: string): Promise<boolean> {
    const query = `
      DELETE FROM reactions 
      WHERE user_id = $1 AND proposal_id = $2
    `;

    const result = await this.db.query(query, [userId, proposalId]);
    return (result.rowCount || 0) > 0;
  }

  /**
   * Get all reactions by a specific user
   */
  async getUserReactions(userId: string): Promise<Reaction[]> {
    const query = `
      SELECT 
        id, 
        user_id as "userId", 
        proposal_id as "proposalId", 
        response, 
        comment, 
        created_at as "createdAt"
      FROM reactions 
      WHERE user_id = $1
      ORDER BY created_at DESC
    `;

    const result = await this.db.query(query, [userId]);
    return result.rows;
  }
}

export const reactionService = new ReactionService();