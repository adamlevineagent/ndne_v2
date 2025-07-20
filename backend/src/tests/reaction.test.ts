import { reactionService } from '../services/reaction';
import pool from '../config/database';

describe('ReactionService', () => {
  let testUserId: string;
  let testProposalId: string;

  beforeAll(async () => {
    // Create a test user
    const userResult = await pool.query(
      'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id',
      ['test-reaction@example.com', 'hashedpassword']
    );
    testUserId = userResult.rows[0].id;

    // Create a test proposal
    const proposalResult = await pool.query(
      'INSERT INTO proposals (title, description) VALUES ($1, $2) RETURNING id',
      ['Test Proposal', 'This is a test proposal for reaction testing']
    );
    testProposalId = proposalResult.rows[0].id;
  });

  afterAll(async () => {
    // Clean up test data
    await pool.query('DELETE FROM reactions WHERE user_id = $1', [testUserId]);
    await pool.query('DELETE FROM proposals WHERE id = $1', [testProposalId]);
    await pool.query('DELETE FROM users WHERE id = $1', [testUserId]);
  });

  afterEach(async () => {
    // Clean up reactions after each test
    await pool.query('DELETE FROM reactions WHERE user_id = $1', [testUserId]);
  });

  describe('createOrUpdateReaction', () => {
    it('should create a new reaction', async () => {
      const reactionData = {
        userId: testUserId,
        proposalId: testProposalId,
        response: 'like' as const,
        comment: 'This is a great proposal!'
      };

      const reaction = await reactionService.createOrUpdateReaction(reactionData);

      expect(reaction).toBeDefined();
      expect(reaction.userId).toBe(testUserId);
      expect(reaction.proposalId).toBe(testProposalId);
      expect(reaction.response).toBe('like');
      expect(reaction.comment).toBe('This is a great proposal!');
    });

    it('should update an existing reaction', async () => {
      // Create initial reaction
      await reactionService.createOrUpdateReaction({
        userId: testUserId,
        proposalId: testProposalId,
        response: 'like',
        comment: 'Initial comment'
      });

      // Update the reaction
      const updatedReaction = await reactionService.createOrUpdateReaction({
        userId: testUserId,
        proposalId: testProposalId,
        response: 'dislike',
        comment: 'Changed my mind'
      });

      expect(updatedReaction.response).toBe('dislike');
      expect(updatedReaction.comment).toBe('Changed my mind');
    });
  });

  describe('getReactionsByProposal', () => {
    it('should return all reactions for a proposal', async () => {
      // Create a reaction
      await reactionService.createOrUpdateReaction({
        userId: testUserId,
        proposalId: testProposalId,
        response: 'like',
        comment: 'Test comment'
      });

      const reactions = await reactionService.getReactionsByProposal(testProposalId);

      expect(reactions).toHaveLength(1);
      expect(reactions[0].userId).toBe(testUserId);
      expect(reactions[0].response).toBe('like');
    });

    it('should return empty array for proposal with no reactions', async () => {
      const reactions = await reactionService.getReactionsByProposal(testProposalId);
      expect(reactions).toHaveLength(0);
    });
  });

  describe('getUserReaction', () => {
    it('should return user reaction if exists', async () => {
      await reactionService.createOrUpdateReaction({
        userId: testUserId,
        proposalId: testProposalId,
        response: 'like',
        comment: 'Test comment'
      });

      const reaction = await reactionService.getUserReaction(testUserId, testProposalId);

      expect(reaction).toBeDefined();
      expect(reaction!.response).toBe('like');
      expect(reaction!.comment).toBe('Test comment');
    });

    it('should return null if no reaction exists', async () => {
      const reaction = await reactionService.getUserReaction(testUserId, testProposalId);
      expect(reaction).toBeNull();
    });
  });

  describe('getReactionStats', () => {
    it('should return correct statistics', async () => {
      // Create a like reaction
      await reactionService.createOrUpdateReaction({
        userId: testUserId,
        proposalId: testProposalId,
        response: 'like'
      });

      const stats = await reactionService.getReactionStats(testProposalId);

      expect(stats.totalReactions).toBe(1);
      expect(stats.likes).toBe(1);
      expect(stats.dislikes).toBe(0);
      expect(stats.likePercentage).toBe(100);
    });

    it('should return zero stats for proposal with no reactions', async () => {
      const stats = await reactionService.getReactionStats(testProposalId);

      expect(stats.totalReactions).toBe(0);
      expect(stats.likes).toBe(0);
      expect(stats.dislikes).toBe(0);
      expect(stats.likePercentage).toBe(0);
    });
  });

  describe('deleteReaction', () => {
    it('should delete existing reaction', async () => {
      // Create a reaction
      await reactionService.createOrUpdateReaction({
        userId: testUserId,
        proposalId: testProposalId,
        response: 'like'
      });

      const deleted = await reactionService.deleteReaction(testUserId, testProposalId);
      expect(deleted).toBe(true);

      // Verify it's deleted
      const reaction = await reactionService.getUserReaction(testUserId, testProposalId);
      expect(reaction).toBeNull();
    });

    it('should return false when trying to delete non-existent reaction', async () => {
      const deleted = await reactionService.deleteReaction(testUserId, testProposalId);
      expect(deleted).toBe(false);
    });
  });
});