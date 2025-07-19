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

export default api;