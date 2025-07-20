import axios from 'axios';
import { ApiResponse } from '../types';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:3000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Health check service
export const healthService = {
  check: async (): Promise<{ status: string; timestamp: string }> => {
    const response = await axios.get('http://localhost:3000/health');
    return response.data;
  },
};

// Auth service
export const authService = {
  login: async (email: string, password: string): Promise<ApiResponse<{ token: string; user: any }>> => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },
  
  register: async (email: string, password: string): Promise<ApiResponse<{ token: string; user: any }>> => {
    const response = await api.post('/auth/register', { email, password });
    return response.data;
  },

  me: async (): Promise<ApiResponse<{ user: any }>> => {
    const response = await api.get('/auth/me');
    return response.data;
  },
};

// Conversation service
export const conversationService = {
  getConversations: async (): Promise<ApiResponse<{ conversations: any[] }>> => {
    const response = await api.get('/conversations');
    return response.data;
  },

  getConversation: async (id: string): Promise<ApiResponse<{ conversation: any }>> => {
    const response = await api.get(`/conversations/${id}`);
    return response.data;
  },

  createConversation: async (message: string): Promise<ApiResponse<{ conversation: any }>> => {
    const response = await api.post('/conversations', { message });
    return response.data;
  },

  addMessage: async (conversationId: string, message: string): Promise<ApiResponse<{ conversation: any }>> => {
    const response = await api.post(`/conversations/${conversationId}/messages`, { message });
    return response.data;
  },

  deleteConversation: async (id: string): Promise<ApiResponse<{ message: string }>> => {
    const response = await api.delete(`/conversations/${id}`);
    return response.data;
  },
};

// Outcome service
export const outcomeService = {
  getOutcomes: async (userId: string): Promise<{ outcomes: any[] }> => {
    const response = await api.get(`/outcomes/${userId}`);
    return response.data;
  },

  createOutcome: async (statement: string, importance: number): Promise<{ outcome: any }> => {
    const response = await api.post('/outcomes', { statement, importance });
    return response.data;
  },

  updateOutcome: async (id: string, updates: { statement?: string; importance?: number }): Promise<{ outcome: any }> => {
    const response = await api.put(`/outcomes/${id}`, updates);
    return response.data;
  },

  deleteOutcome: async (id: string): Promise<ApiResponse<{ message: string }>> => {
    const response = await api.delete(`/outcomes/${id}`);
    return response.data;
  },

  extractOutcomes: async (conversationMessages: any[]): Promise<{ outcomes: any[] }> => {
    const response = await api.post('/outcomes/extract', { conversationMessages });
    return response.data;
  },

  refineOutcome: async (id: string): Promise<{ outcome: any }> => {
    const response = await api.post(`/outcomes/${id}/refine`);
    return response.data;
  },
};

// Proposal service
export const proposalService = {
  getProposals: async (): Promise<{ proposals: any[] }> => {
    const response = await api.get('/proposals');
    return response.data.data; // Backend returns { success: true, data: { proposals: [...] } }
  },

  getProposal: async (id: string): Promise<{ proposal: any }> => {
    const response = await api.get(`/proposals/${id}`);
    return response.data.data; // Backend returns { success: true, data: { proposal: {...} } }
  },

  generateProposals: async (options?: { 
    minSimilarityScore?: number; 
    maxUsers?: number; 
    focusThemes?: string[] 
  }): Promise<{ proposals: any[] }> => {
    const response = await api.post('/proposals/generate', options || {});
    return response.data.data; // Backend returns { success: true, data: { proposals: [...] } }
  },

  getProposalConnections: async (proposalId: string, userId: string): Promise<{ connections: any }> => {
    const response = await api.get(`/proposals/${proposalId}/connections/${userId}`);
    return response.data.data; // Backend returns { success: true, data: { connections: {...} } }
  },
};

// Reaction service
export const reactionService = {
  createOrUpdateReaction: async (proposalId: string, response: 'like' | 'dislike', comment?: string): Promise<any> => {
    const apiResponse = await api.post('/reactions', { proposalId, response, comment });
    return apiResponse.data.data; // Backend returns { success: true, data: reaction }
  },

  getReactionsByProposal: async (proposalId: string): Promise<{ reactions: any[]; stats: any }> => {
    const apiResponse = await api.get(`/reactions/${proposalId}`);
    return apiResponse.data.data; // Backend returns { success: true, data: { reactions, stats } }
  },

  getUserReaction: async (proposalId: string): Promise<any> => {
    const apiResponse = await api.get(`/reactions/${proposalId}/user`);
    return apiResponse.data.data; // Backend returns { success: true, data: reaction }
  },

  deleteReaction: async (proposalId: string): Promise<{ message: string }> => {
    const apiResponse = await api.delete(`/reactions/${proposalId}`);
    return apiResponse.data; // Backend returns { success: true, message: string }
  },

  getUserReactions: async (): Promise<any[]> => {
    const apiResponse = await api.get('/reactions/user/all');
    return apiResponse.data.data; // Backend returns { success: true, data: reactions[] }
  },
};

// Learning service
export const learningService = {
  analyzePatterns: async (): Promise<{ insights: any[] }> => {
    const response = await api.post('/learning/analyze-patterns');
    return response.data;
  },

  evolveOutcomes: async (): Promise<{ evolutions: any[] }> => {
    const response = await api.post('/learning/evolve-outcomes');
    return response.data;
  },

  getValueProfile: async (): Promise<{ profile: any }> => {
    const response = await api.get('/learning/value-profile');
    return response.data;
  },

  getCollectivePatterns: async (): Promise<{ patterns: any[] }> => {
    const response = await api.get('/learning/collective-patterns');
    return response.data;
  },

  triggerLearning: async (): Promise<{ results: any }> => {
    const response = await api.post('/learning/trigger-learning');
    return response.data;
  },

  getInsights: async (): Promise<{ insights: any[] }> => {
    const response = await api.get('/learning/insights');
    return response.data;
  },
};

export default api;