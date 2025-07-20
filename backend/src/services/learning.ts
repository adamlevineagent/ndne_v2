import { Pool } from 'pg';
import { AIService, ChatMessage } from './ai';
import { OutcomeService } from './outcome';
import { ReactionService } from './reaction';

export interface LearningInsight {
  id: string;
  userId: string;
  type: 'outcome_refinement' | 'preference_pattern' | 'value_clarification';
  insight: string;
  confidence: number; // 0.0-1.0
  sourceReactions: string[]; // reaction IDs that contributed to this insight
  appliedToOutcomes: string[]; // outcome IDs that were updated based on this insight
  createdAt: Date;
}

export interface OutcomeEvolution {
  outcomeId: string;
  originalStatement: string;
  evolvedStatement: string;
  evolutionReason: string;
  confidence: number;
  supportingReactions: string[];
}

export interface CollectivePattern {
  id: string;
  patternType: 'shared_value' | 'common_concern' | 'solution_preference';
  description: string;
  affectedUsers: string[]; // anonymized user references
  strength: number; // 0.0-1.0
  examples: string[];
  createdAt: Date;
}

export interface UserValueProfile {
  userId: string;
  coreValues: string[];
  preferencePatterns: {
    solutionTypes: string[];
    implementationPreferences: string[];
    tradeoffTolerance: number; // 0.0-1.0
  };
  reactionPatterns: {
    positiveIndicators: string[];
    negativeIndicators: string[];
    consistencyScore: number; // 0.0-1.0
  };
  lastUpdated: Date;
}

export class LearningService {
  private db: Pool;
  private aiService: AIService;
  private outcomeService: OutcomeService;
  private reactionService: ReactionService;

  constructor(db: Pool, outcomeService: OutcomeService, reactionService: ReactionService) {
    this.db = db;
    this.aiService = new AIService();
    this.outcomeService = outcomeService;
    this.reactionService = reactionService;
  }

  /**
   * Analyze user reactions to extract learning insights about their preferences
   */
  async analyzeUserReactionPatterns(userId: string): Promise<LearningInsight[]> {
    try {
      // Get user's recent reactions with proposal context
      const userReactions = await this.reactionService.getUserReactions(userId);
      
      if (userReactions.length < 3) {
        return []; // Need at least 3 reactions to identify patterns
      }

      // Get proposal details for each reaction
      const reactionsWithProposals = await Promise.all(
        userReactions.map(async (reaction) => {
          const proposalQuery = `
            SELECT id, title, description, similarity_analysis
            FROM proposals 
            WHERE id = $1
          `;
          const proposalResult = await this.db.query(proposalQuery, [reaction.proposalId]);
          return {
            ...reaction,
            proposal: proposalResult.rows[0] || null
          };
        })
      );

      // Use AI to analyze reaction patterns
      const insights = await this.extractReactionInsights(userId, reactionsWithProposals);
      
      // Store insights in database
      const storedInsights: LearningInsight[] = [];
      for (const insight of insights) {
        const stored = await this.storeLearningInsight(insight);
        if (stored) {
          storedInsights.push(stored);
        }
      }

      return storedInsights;
    } catch (error) {
      console.error('Error analyzing user reaction patterns:', error);
      return [];
    }
  }

  /**
   * Use AI to extract insights from user reaction patterns
   */
  private async extractReactionInsights(userId: string, reactionsWithProposals: any[]): Promise<Partial<LearningInsight>[]> {
    try {
      const analysisPrompt: ChatMessage = {
        role: 'system',
        content: `Analyze user reaction patterns to extract insights about their values and preferences.

Look for:
1. Consistent themes in liked vs disliked proposals
2. Value patterns (what they consistently care about)
3. Solution preferences (how they prefer problems to be solved)
4. Tradeoff tolerance (what compromises they accept/reject)

Return a JSON array of insights with this format:
[
  {
    "type": "outcome_refinement" | "preference_pattern" | "value_clarification",
    "insight": "Clear description of what was learned about the user",
    "confidence": 0.0-1.0,
    "sourceReactions": ["reaction-id-1", "reaction-id-2"],
    "reasoning": "Why this insight is supported by the reaction data"
  }
]

Guidelines:
- Only include insights with confidence > 0.6
- Focus on actionable insights that could improve outcome representation
- Look for patterns across multiple reactions, not single instances
- Be specific about what the user values or prefers`
      };

      const reactionsText = reactionsWithProposals
        .filter(r => r.proposal)
        .map(r => `
Reaction ID: ${r.id}
Response: ${r.response}
Comment: ${r.comment || 'No comment'}
Proposal: "${r.proposal.title}"
Description: "${r.proposal.description.substring(0, 200)}..."
        `).join('\n---\n');

      const userMessage: ChatMessage = {
        role: 'user',
        content: `Analyze these reaction patterns for user insights:

${reactionsText}

Extract insights about this user's values, preferences, and what they want in solutions.`
      };

      const response = await AIService.chat([analysisPrompt, userMessage]);
      
      try {
        let cleanedResponse = response.message.trim();
        if (cleanedResponse.startsWith('```json')) {
          cleanedResponse = cleanedResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        } else if (cleanedResponse.startsWith('```')) {
          cleanedResponse = cleanedResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
        }
        
        const insights = JSON.parse(cleanedResponse);
        
        return Array.isArray(insights) ? insights.map(insight => ({
          userId,
          type: insight.type,
          insight: insight.insight,
          confidence: Math.max(0, Math.min(1, insight.confidence || 0)),
          sourceReactions: Array.isArray(insight.sourceReactions) ? insight.sourceReactions : [],
          appliedToOutcomes: [],
          createdAt: new Date()
        })) : [];
      } catch (parseError) {
        console.error('Error parsing reaction insights:', parseError);
        return [];
      }
    } catch (error) {
      console.error('Error extracting reaction insights:', error);
      return [];
    }
  }

  /**
   * Evolve user outcomes based on reaction patterns and insights
   */
  async evolveUserOutcomes(userId: string): Promise<OutcomeEvolution[]> {
    try {
      // Get user's current outcomes
      const outcomes = await this.outcomeService.getOutcomesByUserId(userId);
      
      if (outcomes.length === 0) {
        return [];
      }

      // Get recent learning insights
      const insights = await this.getLearningInsights(userId);
      
      if (insights.length === 0) {
        return [];
      }

      // Use AI to suggest outcome evolutions
      const evolutions = await this.generateOutcomeEvolutions(outcomes, insights);
      
      // Apply evolutions that meet confidence threshold
      const appliedEvolutions: OutcomeEvolution[] = [];
      
      for (const evolution of evolutions) {
        if (evolution.confidence >= 0.7) {
          // Update the outcome
          const updated = await this.outcomeService.updateOutcome(
            evolution.outcomeId,
            userId,
            { statement: evolution.evolvedStatement }
          );
          
          if (updated) {
            appliedEvolutions.push(evolution);
            
            // Mark insights as applied
            await this.markInsightsAsApplied(
              evolution.supportingReactions,
              [evolution.outcomeId]
            );
          }
        }
      }

      return appliedEvolutions;
    } catch (error) {
      console.error('Error evolving user outcomes:', error);
      return [];
    }
  }

  /**
   * Generate outcome evolution suggestions using AI
   */
  private async generateOutcomeEvolutions(outcomes: any[], insights: LearningInsight[]): Promise<OutcomeEvolution[]> {
    try {
      const evolutionPrompt: ChatMessage = {
        role: 'system',
        content: `Based on learning insights from user reactions, suggest how to evolve outcome statements to better represent what the user truly wants.

Guidelines:
1. Keep the "I want a world where..." format
2. Make outcomes more specific and aligned with revealed preferences
3. Only suggest changes with high confidence (0.7+)
4. Preserve the core intent while refining based on insights
5. Focus on making outcomes more actionable and precise

Return a JSON array:
[
  {
    "outcomeId": "outcome-id",
    "originalStatement": "original statement",
    "evolvedStatement": "improved statement based on insights",
    "evolutionReason": "explanation of why this change better represents user values",
    "confidence": 0.0-1.0,
    "supportingInsights": ["insight descriptions that support this evolution"]
  }
]

Only include evolutions with confidence >= 0.7`
      };

      const outcomesText = outcomes.map(o => 
        `ID: ${o.id}\nStatement: "${o.statement}"\nImportance: ${o.importance}/5`
      ).join('\n---\n');

      const insightsText = insights.map(i => 
        `Type: ${i.type}\nInsight: ${i.insight}\nConfidence: ${i.confidence}`
      ).join('\n---\n');

      const userMessage: ChatMessage = {
        role: 'user',
        content: `Current Outcomes:
${outcomesText}

Learning Insights:
${insightsText}

Suggest how to evolve these outcomes based on the insights.`
      };

      const response = await AIService.chat([evolutionPrompt, userMessage]);
      
      try {
        let cleanedResponse = response.message.trim();
        if (cleanedResponse.startsWith('```json')) {
          cleanedResponse = cleanedResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        } else if (cleanedResponse.startsWith('```')) {
          cleanedResponse = cleanedResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
        }
        
        const evolutions = JSON.parse(cleanedResponse);
        
        return Array.isArray(evolutions) ? evolutions.map(evo => ({
          outcomeId: evo.outcomeId,
          originalStatement: evo.originalStatement,
          evolvedStatement: evo.evolvedStatement,
          evolutionReason: evo.evolutionReason,
          confidence: Math.max(0, Math.min(1, evo.confidence || 0)),
          supportingReactions: [] // Will be populated from insights
        })) : [];
      } catch (parseError) {
        console.error('Error parsing outcome evolutions:', parseError);
        return [];
      }
    } catch (error) {
      console.error('Error generating outcome evolutions:', error);
      return [];
    }
  }

  /**
   * Identify collective patterns across all users while preserving anonymity
   */
  async identifyCollectivePatterns(): Promise<CollectivePattern[]> {
    try {
      // Get anonymized reaction data across all users
      const anonymizedData = await this.getAnonymizedReactionData();
      
      if (anonymizedData.length < 10) {
        return []; // Need sufficient data for pattern analysis
      }

      // Use AI to identify collective patterns
      const patterns = await this.extractCollectivePatterns(anonymizedData);
      
      // Store patterns in database
      const storedPatterns: CollectivePattern[] = [];
      for (const pattern of patterns) {
        const stored = await this.storeCollectivePattern(pattern);
        if (stored) {
          storedPatterns.push(stored);
        }
      }

      return storedPatterns;
    } catch (error) {
      console.error('Error identifying collective patterns:', error);
      return [];
    }
  }

  /**
   * Get anonymized reaction data for collective analysis
   */
  private async getAnonymizedReactionData(): Promise<any[]> {
    const query = `
      SELECT 
        'user_' || ROW_NUMBER() OVER (ORDER BY r.user_id) as anonymous_user_id,
        r.response,
        r.comment,
        p.title as proposal_title,
        p.description as proposal_description,
        p.similarity_analysis
      FROM reactions r
      JOIN proposals p ON r.proposal_id = p.id
      WHERE r.created_at >= NOW() - INTERVAL '30 days'
      ORDER BY r.created_at DESC
      LIMIT 100
    `;

    const result = await this.db.query(query);
    return result.rows;
  }

  /**
   * Extract collective patterns using AI
   */
  private async extractCollectivePatterns(anonymizedData: any[]): Promise<Partial<CollectivePattern>[]> {
    try {
      const patternPrompt: ChatMessage = {
        role: 'system',
        content: `Analyze anonymized user reaction data to identify collective patterns while preserving individual privacy.

Look for:
1. Shared values across users (what most people consistently care about)
2. Common concerns (what issues repeatedly generate strong reactions)
3. Solution preferences (what types of solutions are generally preferred)

Return a JSON array:
[
  {
    "patternType": "shared_value" | "common_concern" | "solution_preference",
    "description": "Clear description of the collective pattern",
    "strength": 0.0-1.0,
    "examples": ["example 1", "example 2"],
    "reasoning": "Why this pattern is significant"
  }
]

Guidelines:
- Only include patterns with strength > 0.6
- Focus on patterns that appear across multiple anonymous users
- Preserve anonymity - don't reference specific users
- Look for actionable insights for better proposal generation`
      };

      const dataText = anonymizedData.slice(0, 50).map(d => `
User: ${d.anonymous_user_id}
Response: ${d.response}
Comment: ${d.comment || 'No comment'}
Proposal: "${d.proposal_title}"
      `).join('\n---\n');

      const userMessage: ChatMessage = {
        role: 'user',
        content: `Analyze this anonymized reaction data for collective patterns:

${dataText}

Identify patterns that could help generate better proposals for the community.`
      };

      const response = await AIService.chat([patternPrompt, userMessage]);
      
      try {
        let cleanedResponse = response.message.trim();
        if (cleanedResponse.startsWith('```json')) {
          cleanedResponse = cleanedResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        } else if (cleanedResponse.startsWith('```')) {
          cleanedResponse = cleanedResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
        }
        
        const patterns = JSON.parse(cleanedResponse);
        
        return Array.isArray(patterns) ? patterns.map(pattern => ({
          patternType: pattern.patternType,
          description: pattern.description,
          affectedUsers: [], // Anonymized, so we don't track specific users
          strength: Math.max(0, Math.min(1, pattern.strength || 0)),
          examples: Array.isArray(pattern.examples) ? pattern.examples : [],
          createdAt: new Date()
        })) : [];
      } catch (parseError) {
        console.error('Error parsing collective patterns:', parseError);
        return [];
      }
    } catch (error) {
      console.error('Error extracting collective patterns:', error);
      return [];
    }
  }

  /**
   * Build and update user value profile based on reactions and outcomes
   */
  async buildUserValueProfile(userId: string): Promise<UserValueProfile | null> {
    try {
      // Get user's outcomes and reactions
      const outcomes = await this.outcomeService.getOutcomesByUserId(userId);
      const reactions = await this.reactionService.getUserReactions(userId);
      const insights = await this.getLearningInsights(userId);

      if (outcomes.length === 0 && reactions.length === 0) {
        return null;
      }

      // Use AI to build comprehensive value profile
      const profile = await this.generateValueProfile(userId, outcomes, reactions, insights);
      
      if (profile) {
        await this.storeUserValueProfile(profile);
      }

      return profile;
    } catch (error) {
      console.error('Error building user value profile:', error);
      return null;
    }
  }

  /**
   * Generate user value profile using AI
   */
  private async generateValueProfile(
    userId: string, 
    outcomes: any[], 
    reactions: any[], 
    insights: LearningInsight[]
  ): Promise<UserValueProfile | null> {
    try {
      const profilePrompt: ChatMessage = {
        role: 'system',
        content: `Build a comprehensive value profile for a user based on their outcomes, reactions, and learning insights.

Return a JSON object:
{
  "coreValues": ["value1", "value2", "value3"],
  "preferencePatterns": {
    "solutionTypes": ["type1", "type2"],
    "implementationPreferences": ["pref1", "pref2"],
    "tradeoffTolerance": 0.0-1.0
  },
  "reactionPatterns": {
    "positiveIndicators": ["what they consistently like"],
    "negativeIndicators": ["what they consistently dislike"],
    "consistencyScore": 0.0-1.0
  }
}

Guidelines:
- Identify 3-5 core values that drive their decisions
- Note patterns in what types of solutions they prefer
- Assess their tolerance for tradeoffs and compromises
- Rate consistency of their reactions (1.0 = very consistent)`
      };

      const outcomesText = outcomes.map(o => `"${o.statement}" (importance: ${o.importance}/5)`).join('\n');
      const reactionsText = reactions.slice(0, 10).map(r => `${r.response}: ${r.comment || 'No comment'}`).join('\n');
      const insightsText = insights.map(i => i.insight).join('\n');

      const userMessage: ChatMessage = {
        role: 'user',
        content: `Build value profile from this data:

Outcomes:
${outcomesText}

Recent Reactions:
${reactionsText}

Learning Insights:
${insightsText}

Create a comprehensive profile of this user's values and preferences.`
      };

      const response = await AIService.chat([profilePrompt, userMessage]);
      
      try {
        let cleanedResponse = response.message.trim();
        if (cleanedResponse.startsWith('```json')) {
          cleanedResponse = cleanedResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        } else if (cleanedResponse.startsWith('```')) {
          cleanedResponse = cleanedResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
        }
        
        const profileData = JSON.parse(cleanedResponse);
        
        return {
          userId,
          coreValues: Array.isArray(profileData.coreValues) ? profileData.coreValues : [],
          preferencePatterns: {
            solutionTypes: Array.isArray(profileData.preferencePatterns?.solutionTypes) ? profileData.preferencePatterns.solutionTypes : [],
            implementationPreferences: Array.isArray(profileData.preferencePatterns?.implementationPreferences) ? profileData.preferencePatterns.implementationPreferences : [],
            tradeoffTolerance: Math.max(0, Math.min(1, profileData.preferencePatterns?.tradeoffTolerance || 0.5))
          },
          reactionPatterns: {
            positiveIndicators: Array.isArray(profileData.reactionPatterns?.positiveIndicators) ? profileData.reactionPatterns.positiveIndicators : [],
            negativeIndicators: Array.isArray(profileData.reactionPatterns?.negativeIndicators) ? profileData.reactionPatterns.negativeIndicators : [],
            consistencyScore: Math.max(0, Math.min(1, profileData.reactionPatterns?.consistencyScore || 0.5))
          },
          lastUpdated: new Date()
        };
      } catch (parseError) {
        console.error('Error parsing value profile:', parseError);
        return null;
      }
    } catch (error) {
      console.error('Error generating value profile:', error);
      return null;
    }
  }

  /**
   * Process new reaction to trigger learning updates
   */
  async processNewReaction(userId: string, reactionId: string): Promise<void> {
    try {
      // Analyze updated reaction patterns
      const insights = await this.analyzeUserReactionPatterns(userId);
      
      if (insights.length > 0) {
        // Evolve outcomes based on new insights
        await this.evolveUserOutcomes(userId);
        
        // Update user value profile
        await this.buildUserValueProfile(userId);
      }

      // Update collective patterns (run periodically, not on every reaction)
      const shouldUpdateCollective = Math.random() < 0.1; // 10% chance
      if (shouldUpdateCollective) {
        await this.identifyCollectivePatterns();
      }
    } catch (error) {
      console.error('Error processing new reaction for learning:', error);
    }
  }

  // Database helper methods
  private async storeLearningInsight(insight: Partial<LearningInsight>): Promise<LearningInsight | null> {
    try {
      const query = `
        INSERT INTO learning_insights (user_id, type, insight, confidence, source_reactions, applied_to_outcomes)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, user_id, type, insight, confidence, source_reactions, applied_to_outcomes, created_at
      `;

      const result = await this.db.query(query, [
        insight.userId,
        insight.type,
        insight.insight,
        insight.confidence,
        JSON.stringify(insight.sourceReactions || []),
        JSON.stringify(insight.appliedToOutcomes || [])
      ]);

      const row = result.rows[0];
      return {
        id: row.id,
        userId: row.user_id,
        type: row.type,
        insight: row.insight,
        confidence: row.confidence,
        sourceReactions: row.source_reactions || [],
        appliedToOutcomes: row.applied_to_outcomes || [],
        createdAt: row.created_at
      };
    } catch (error) {
      console.error('Error storing learning insight:', error);
      return null;
    }
  }

  private async getLearningInsights(userId: string): Promise<LearningInsight[]> {
    try {
      const query = `
        SELECT id, user_id, type, insight, confidence, source_reactions, applied_to_outcomes, created_at
        FROM learning_insights
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT 20
      `;

      const result = await this.db.query(query, [userId]);
      return result.rows.map(row => ({
        id: row.id,
        userId: row.user_id,
        type: row.type,
        insight: row.insight,
        confidence: row.confidence,
        sourceReactions: row.source_reactions || [],
        appliedToOutcomes: row.applied_to_outcomes || [],
        createdAt: row.created_at
      }));
    } catch (error) {
      console.error('Error getting learning insights:', error);
      return [];
    }
  }

  private async markInsightsAsApplied(reactionIds: string[], outcomeIds: string[]): Promise<void> {
    try {
      const query = `
        UPDATE learning_insights
        SET applied_to_outcomes = applied_to_outcomes || $1
        WHERE source_reactions && $2
      `;

      await this.db.query(query, [
        JSON.stringify(outcomeIds),
        JSON.stringify(reactionIds)
      ]);
    } catch (error) {
      console.error('Error marking insights as applied:', error);
    }
  }

  private async storeCollectivePattern(pattern: Partial<CollectivePattern>): Promise<CollectivePattern | null> {
    try {
      const query = `
        INSERT INTO collective_patterns (pattern_type, description, affected_users, strength, examples)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, pattern_type, description, affected_users, strength, examples, created_at
      `;

      const result = await this.db.query(query, [
        pattern.patternType,
        pattern.description,
        JSON.stringify(pattern.affectedUsers || []),
        pattern.strength,
        JSON.stringify(pattern.examples || [])
      ]);

      const row = result.rows[0];
      return {
        id: row.id,
        patternType: row.pattern_type,
        description: row.description,
        affectedUsers: row.affected_users || [],
        strength: row.strength,
        examples: row.examples || [],
        createdAt: row.created_at
      };
    } catch (error) {
      console.error('Error storing collective pattern:', error);
      return null;
    }
  }

  private async storeUserValueProfile(profile: UserValueProfile): Promise<void> {
    try {
      const query = `
        INSERT INTO user_value_profiles (user_id, core_values, preference_patterns, reaction_patterns, last_updated)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (user_id)
        DO UPDATE SET
          core_values = EXCLUDED.core_values,
          preference_patterns = EXCLUDED.preference_patterns,
          reaction_patterns = EXCLUDED.reaction_patterns,
          last_updated = EXCLUDED.last_updated
      `;

      await this.db.query(query, [
        profile.userId,
        JSON.stringify(profile.coreValues),
        JSON.stringify(profile.preferencePatterns),
        JSON.stringify(profile.reactionPatterns),
        profile.lastUpdated
      ]);
    } catch (error) {
      console.error('Error storing user value profile:', error);
    }
  }
}