import { Pool } from 'pg';
import { AIService, ChatMessage } from './ai';

export interface Proposal {
  id: string;
  title: string;
  description: string;
  similarityAnalysis: SimilarityAnalysis;
  contributingUsers: string[];
  createdAt: Date;
}

export interface SimilarityAnalysis {
  matchedOutcomes: OutcomeMatch[];
  sharedThemes: string[];
  overallSimilarityScore: number;
  synthesisReasoning: string;
}

export interface OutcomeMatch {
  userId: string;
  outcomeId: string;
  statement: string;
  importance: number;
  similarityScore: number;
  sharedThemes: string[];
}

export interface GenerateProposalRequest {
  minSimilarityScore?: number;
  maxUsers?: number;
  focusThemes?: string[];
}

export class ProposalService {
  private db: Pool;

  constructor(db: Pool) {
    this.db = db;
  }

  /**
   * Generate proposals by finding users with similar outcomes and creating synthesized solutions
   */
  async generateProposals(request: GenerateProposalRequest = {}): Promise<Proposal[]> {
    const {
      minSimilarityScore = 0.6,
      maxUsers = 10,
      focusThemes = []
    } = request;

    try {
      // Step 1: Get all outcomes from database
      const allOutcomes = await this.getAllOutcomes();
      
      if (allOutcomes.length < 2) {
        throw new Error('Need at least 2 outcomes to generate proposals');
      }

      // Step 2: Find similar outcome groups using AI
      const similarityGroups = await this.findSimilarOutcomeGroups(
        allOutcomes, 
        minSimilarityScore,
        maxUsers,
        focusThemes
      );

      // Step 3: Generate proposals for each similarity group
      const proposals: Proposal[] = [];
      
      for (const group of similarityGroups) {
        if (group.matchedOutcomes.length >= 2) {
          const proposal = await this.generateProposalForGroup(group);
          if (proposal) {
            proposals.push(proposal);
          }
        }
      }

      return proposals;
    } catch (error) {
      console.error('Error generating proposals:', error);
      throw new Error('Failed to generate proposals');
    }
  }

  /**
   * Get all proposals from database
   */
  async getAllProposals(): Promise<Proposal[]> {
    const query = `
      SELECT p.id, p.title, p.description, p.similarity_analysis, p.created_at,
             ARRAY_AGG(pu.user_id) as contributing_users
      FROM proposals p
      LEFT JOIN proposal_users pu ON p.id = pu.proposal_id
      GROUP BY p.id, p.title, p.description, p.similarity_analysis, p.created_at
      ORDER BY p.created_at DESC
    `;

    const result = await this.db.query(query);
    return result.rows.map(row => this.mapRowToProposal(row));
  }

  /**
   * Get a specific proposal by ID
   */
  async getProposalById(id: string): Promise<Proposal | null> {
    const query = `
      SELECT p.id, p.title, p.description, p.similarity_analysis, p.created_at,
             ARRAY_AGG(pu.user_id) as contributing_users
      FROM proposals p
      LEFT JOIN proposal_users pu ON p.id = pu.proposal_id
      WHERE p.id = $1
      GROUP BY p.id, p.title, p.description, p.similarity_analysis, p.created_at
    `;

    const result = await this.db.query(query, [id]);
    if (result.rows.length === 0) {
      return null;
    }
    return this.mapRowToProposal(result.rows[0]);
  }

  /**
   * Get all outcomes from database
   */
  private async getAllOutcomes(): Promise<any[]> {
    const query = `
      SELECT id, user_id, statement, importance, created_at
      FROM outcomes
      ORDER BY importance DESC, created_at DESC
    `;

    const result = await this.db.query(query);
    return result.rows;
  }

  /**
   * Use AI to find groups of similar outcomes
   */
  private async findSimilarOutcomeGroups(
    outcomes: any[], 
    minSimilarityScore: number,
    maxUsers: number,
    focusThemes: string[]
  ): Promise<SimilarityAnalysis[]> {
    const groups: SimilarityAnalysis[] = [];
    const processedOutcomes = new Set<string>();

    // Create batches of outcomes to analyze for similarity
    for (let i = 0; i < outcomes.length; i++) {
      const baseOutcome = outcomes[i];
      
      if (processedOutcomes.has(baseOutcome.id)) {
        continue;
      }

      const potentialMatches: OutcomeMatch[] = [];
      
      // Compare with other outcomes
      for (let j = i + 1; j < outcomes.length && potentialMatches.length < maxUsers; j++) {
        const compareOutcome = outcomes[j];
        
        if (processedOutcomes.has(compareOutcome.id) || 
            baseOutcome.user_id === compareOutcome.user_id) {
          continue;
        }

        // Use AI to analyze similarity
        const similarity = await this.analyzeSimilarity(baseOutcome, compareOutcome);
        
        if (similarity.similarityScore >= minSimilarityScore) {
          potentialMatches.push({
            userId: compareOutcome.user_id,
            outcomeId: compareOutcome.id,
            statement: compareOutcome.statement,
            importance: compareOutcome.importance,
            similarityScore: similarity.similarityScore,
            sharedThemes: similarity.sharedThemes
          });
        }
      }

      // If we found similar outcomes, create a group
      if (potentialMatches.length > 0) {
        // Add the base outcome to matches
        const baseMatch: OutcomeMatch = {
          userId: baseOutcome.user_id,
          outcomeId: baseOutcome.id,
          statement: baseOutcome.statement,
          importance: baseOutcome.importance,
          similarityScore: 1.0,
          sharedThemes: []
        };

        const allMatches = [baseMatch, ...potentialMatches];
        
        // Calculate overall similarity and themes
        const overallScore = potentialMatches.reduce((sum, match) => sum + match.similarityScore, 0) / potentialMatches.length;
        const allThemes = potentialMatches.flatMap(match => match.sharedThemes);
        const uniqueThemes = [...new Set(allThemes)];

        groups.push({
          matchedOutcomes: allMatches,
          sharedThemes: uniqueThemes,
          overallSimilarityScore: overallScore,
          synthesisReasoning: ''
        });

        // Mark these outcomes as processed
        allMatches.forEach(match => processedOutcomes.add(match.outcomeId));
      }
    }

    return groups;
  }

  /**
   * Use AI to analyze similarity between two outcomes
   */
  private async analyzeSimilarity(outcome1: any, outcome2: any): Promise<{
    similarityScore: number;
    sharedThemes: string[];
  }> {
    try {
      const analysisPrompt: ChatMessage = {
        role: 'system',
        content: `Analyze the semantic similarity between these two desired outcomes. 

Return a JSON object with:
{
  "similarityScore": 0.0-1.0 (how similar the underlying desires are),
  "sharedThemes": ["theme1", "theme2"] (common themes/values)
}

Guidelines:
- Focus on underlying values and desired end states, not specific wording
- Score 0.8+ for very similar desires (same core goal)
- Score 0.6-0.8 for related desires (complementary goals)
- Score 0.4-0.6 for somewhat related (shared themes but different focus)
- Score below 0.4 for unrelated desires
- Identify 2-4 shared themes when similarity > 0.6

Example themes: "equality", "education", "environment", "health", "safety", "freedom", "community", "innovation"`
      };

      const userMessage: ChatMessage = {
        role: 'user',
        content: `Outcome 1: "${outcome1.statement}"
Outcome 2: "${outcome2.statement}"`
      };

      const response = await AIService.chat([analysisPrompt, userMessage]);
      
      try {
        // Clean the response by removing markdown code blocks if present
        let cleanedResponse = response.message.trim();
        if (cleanedResponse.startsWith('```json')) {
          cleanedResponse = cleanedResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        } else if (cleanedResponse.startsWith('```')) {
          cleanedResponse = cleanedResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
        }
        
        const analysis = JSON.parse(cleanedResponse);
        return {
          similarityScore: Math.max(0, Math.min(1, analysis.similarityScore || 0)),
          sharedThemes: Array.isArray(analysis.sharedThemes) ? analysis.sharedThemes : []
        };
      } catch (parseError: any) {
        console.error('Error parsing similarity analysis:', parseError.message);
        console.error('Raw response:', response.message);
        return { similarityScore: 0, sharedThemes: [] };
      }
    } catch (error) {
      console.error('Error analyzing similarity:', error);
      return { similarityScore: 0, sharedThemes: [] };
    }
  }

  /**
   * Generate a proposal for a group of similar outcomes
   */
  private async generateProposalForGroup(group: SimilarityAnalysis): Promise<Proposal | null> {
    try {
      const proposalPrompt: ChatMessage = {
        role: 'system',
        content: `You are generating a proposal that addresses multiple users' desired outcomes. 

Create a solution that:
1. Addresses the provided outcomes
2. Explains clear benefits
3. Suggests practical implementation
4. Focuses on win-win solutions

Return ONLY a valid JSON object (no markdown formatting) with:
{
  "title": "Clear, compelling title (max 80 chars)",
  "description": "Detailed explanation of the proposal and benefits (300-500 words). Use simple quotes, avoid complex punctuation.",
  "synthesisReasoning": "Brief explanation of how this addresses the similar outcomes (50-100 words)"
}

IMPORTANT: 
- Return only valid JSON, no markdown code blocks
- Use simple language and avoid complex punctuation
- Keep descriptions concise but informative
- Escape quotes properly in JSON`
      };

      const outcomesText = group.matchedOutcomes
        .map((match, index) => `${index + 1}. "${match.statement}" (importance: ${match.importance}/5)`)
        .join('\n');

      const userMessage: ChatMessage = {
        role: 'user',
        content: `Generate a proposal that addresses these similar desired outcomes:

${outcomesText}

Shared themes: ${group.sharedThemes.join(', ')}
Overall similarity score: ${group.overallSimilarityScore.toFixed(2)}`
      };

      const response = await AIService.chat([proposalPrompt, userMessage]);
      
      try {
        // Clean the response by removing markdown code blocks if present
        let cleanedResponse = response.message.trim();
        if (cleanedResponse.startsWith('```json')) {
          cleanedResponse = cleanedResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        } else if (cleanedResponse.startsWith('```')) {
          cleanedResponse = cleanedResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
        }
        
        const proposalData = JSON.parse(cleanedResponse);
        
        // Store the proposal in database
        const proposal = await this.storeProposal({
          title: proposalData.title,
          description: proposalData.description,
          similarityAnalysis: {
            ...group,
            synthesisReasoning: proposalData.synthesisReasoning
          },
          contributingUserIds: group.matchedOutcomes.map(match => match.userId)
        });

        return proposal;
      } catch (parseError: any) {
        console.error('Error parsing proposal JSON:', parseError.message);
        console.error('Raw response:', response.message);
        return null;
      }
    } catch (error) {
      console.error('Error generating proposal for group:', error);
      return null;
    }
  }

  /**
   * Store a proposal in the database
   */
  private async storeProposal(data: {
    title: string;
    description: string;
    similarityAnalysis: SimilarityAnalysis;
    contributingUserIds: string[];
  }): Promise<Proposal> {
    const client = await this.db.connect();
    
    try {
      await client.query('BEGIN');

      // Insert proposal
      const proposalQuery = `
        INSERT INTO proposals (title, description, similarity_analysis)
        VALUES ($1, $2, $3)
        RETURNING id, title, description, similarity_analysis, created_at
      `;

      const proposalResult = await client.query(proposalQuery, [
        data.title,
        data.description,
        JSON.stringify(data.similarityAnalysis)
      ]);

      const proposal = proposalResult.rows[0];

      // Insert proposal-user relationships (avoid duplicates)
      const uniqueUserIds = [...new Set(data.contributingUserIds)];
      for (const userId of uniqueUserIds) {
        await client.query(
          'INSERT INTO proposal_users (proposal_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [proposal.id, userId]
        );
      }

      await client.query('COMMIT');

      return {
        id: proposal.id,
        title: proposal.title,
        description: proposal.description,
        similarityAnalysis: proposal.similarity_analysis,
        contributingUsers: data.contributingUserIds,
        createdAt: proposal.created_at
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Map database row to Proposal object
   */
  private mapRowToProposal(row: any): Proposal {
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      similarityAnalysis: row.similarity_analysis || {},
      contributingUsers: row.contributing_users || [],
      createdAt: row.created_at
    };
  }
}