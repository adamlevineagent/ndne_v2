import pool from '../config/database';
import { AIService } from './ai';
import { OutcomeService } from './outcome';
import { ReactionService } from './reaction';
import { LearningService } from './learning';

// Initialize services with proper dependency injection
const aiService = new AIService();
const outcomeService = new OutcomeService(pool, aiService);
const reactionService = new ReactionService();
const learningService = new LearningService(pool, outcomeService, reactionService);

// Inject learning service into reaction service to avoid circular dependency
reactionService.setLearningService(learningService);

export {
  aiService,
  outcomeService,
  reactionService,
  learningService
};