// Core data types for NDNE V2 Platform

export interface User {
  id: string;
  email: string;
  createdAt: Date;
}

export interface Outcome {
  id: string;
  userId: string;
  statement: string;
  importance: number; // 1-5 scale
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

export interface Proposal {
  id: string;
  title: string;
  description: string;
  createdAt: Date;
}

export interface ProposalOutcomeConnections {
  proposalId: string;
  userId: string;
  userOutcomes: UserOutcomeConnection[];
  benefitExplanation: string;
  overallRelevanceScore: number;
  sharedThemes: string[];
}

export interface UserOutcomeConnection {
  outcomeId: string;
  statement: string;
  importance: number;
  connectionStrength: number;
  howProposalHelps: string;
  sharedThemes: string[];
}

export interface Reaction {
  id: string;
  userId: string;
  proposalId: string;
  response: 'like' | 'dislike';
  comment?: string;
  createdAt: Date;
}

export interface Conversation {
  id: string;
  userId: string;
  messages: ChatMessage[];
  createdAt: Date;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// API Response types
export interface ApiResponse<T> {
  data?: T;
  message?: string;
  user?: any;
  token?: string;
  conversation?: any;
  conversations?: any[];
}

export interface ApiError {
  error: string;
  details?: string;
}