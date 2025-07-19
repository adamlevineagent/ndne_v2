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
  createdAt: Date;
}

export interface Proposal {
  id: string;
  title: string;
  description: string;
  createdAt: Date;
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
  data: T;
  message?: string;
}

export interface ApiError {
  error: string;
  details?: string;
}