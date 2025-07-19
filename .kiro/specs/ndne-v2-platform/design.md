# NDNE V2 Platform Design Document

## Overview

This design document outlines a minimal prototype for the NDNE V2 platform that validates the core concept of outcome-oriented deliberation. The prototype focuses on the essential components needed to demonstrate AI-mediated solution discovery without the complexity of a production system.

## Prototype Architecture

### Simplified System Architecture

```
┌─────────────────────────────────────────┐
│         Frontend (React)                │
│   • Simple web interface               │
│   • Outcome collection forms           │
│   • Proposal viewing and reactions     │
└────────────────┬────────────────────────┘
                 │ REST API
┌────────────────┴────────────────────────┐
│         Backend (Node.js/Express)       │
│   • Basic authentication               │
│   • API endpoints                      │
│   • AI integration (OpenRouter)        │
└────────────────┬────────────────────────┘
                 │
┌────────────────┴────────────────────────┐
│         Database (PostgreSQL)           │
│   • Users, outcomes, proposals          │
│   • Reactions and basic patterns        │
└─────────────────────────────────────────┘
```

### Core Data Flow

```
User Input → Home Mind AI → Outcome Storage
     ↓
Outcome Matching → Simple Proposals → User Reactions
     ↓
Reaction Learning → Improved Proposals
```

## Components and Interfaces

### 1. Simplified Home Mind AI

#### Basic Interface
```typescript
interface HomeMind {
  userId: string;
  
  // Simple conversation processing
  chat(message: string): Promise<string>;
  
  // Extract outcomes from conversation
  extractOutcomes(conversation: string[]): Promise<Outcome[]>;
  
  // Generate simple proposals
  generateProposal(userOutcomes: Outcome[]): Promise<Proposal>;
}
```

### 2. AI-Powered Outcome Analysis

#### Intelligent Matching and Analysis
```typescript
interface OutcomeAnalyzer {
  // Use AI to find users with semantically similar outcomes
  findSimilarOutcomes(userId: string): Promise<SimilarityMatch[]>;
  
  // AI-powered proposal generation for groups with aligned outcomes
  generateGroupProposal(similarOutcomes: SimilarityMatch[]): Promise<Proposal>;
  
  // Extract themes and patterns from outcomes using AI
  analyzeOutcomePatterns(outcomes: Outcome[]): Promise<OutcomeAnalysis>;
}

interface SimilarityMatch {
  userId: string;
  outcomes: Outcome[];
  similarityScore: number; // AI-calculated semantic similarity
  sharedThemes: string[];
}
```

## Data Models

### Minimal Data Structures

#### Core Models for Prototype
```typescript
interface User {
  id: string;
  email: string;
  createdAt: Date;
}

interface Outcome {
  id: string;
  userId: string;
  statement: string; // "I want a world where..."
  importance: number; // 1-5 scale
  createdAt: Date;
}

interface Proposal {
  id: string;
  title: string;
  description: string;
  createdAt: Date;
}

interface Reaction {
  id: string;
  userId: string;
  proposalId: string;
  response: 'like' | 'dislike';
  comment?: string;
  createdAt: Date;
}
```

### Simple Database Schema

#### PostgreSQL Tables (Minimal)
```sql
-- Basic user table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  api_key VARCHAR(255), -- User's OpenRouter API key for enhanced features
  created_at TIMESTAMP DEFAULT NOW()
);

-- User outcomes
CREATE TABLE outcomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  statement TEXT NOT NULL,
  importance INTEGER CHECK (importance >= 1 AND importance <= 5),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Generated proposals
CREATE TABLE proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(500) NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- User reactions to proposals
CREATE TABLE reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  proposal_id UUID REFERENCES proposals(id) ON DELETE CASCADE,
  response VARCHAR(10) CHECK (response IN ('like', 'dislike')),
  comment TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, proposal_id)
);

-- Track which users influenced each proposal
CREATE TABLE proposal_users (
  proposal_id UUID REFERENCES proposals(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (proposal_id, user_id)
);

-- Simple conversation storage for Home Mind
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  messages JSONB NOT NULL, -- Array of {role: 'user'|'assistant', content: string}
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Error Handling

### Basic Error Handling for Prototype
- Simple try-catch blocks with console logging
- Basic API error responses (400, 500 status codes)
- Graceful degradation when AI service is unavailable

## Testing Strategy

### Minimal Testing Approach
- Basic unit tests for core functions
- Simple integration tests for API endpoints
- Manual testing for user flows
- Smoke tests to ensure system works end-to-end

## Implementation Considerations

### Prototype Constraints
- Single server deployment
- Basic authentication (email/password)
- Simple file-based logging
- No caching initially
- Direct database queries (no ORM complexity)

### Technology Stack
- **Frontend**: React with TypeScript
- **Backend**: Node.js/Express with TypeScript
- **Database**: PostgreSQL
- **AI**: OpenRouter API integration
- **Authentication**: JWT tokens
- **Deployment**: Single server (DigitalOcean/Heroku)

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

### Conversations
- `GET /api/conversations/:userId` - Get user's conversation history
- `POST /api/conversations` - Send message to Home Mind AI

### Outcomes
- `GET /api/outcomes/:userId` - Get user's outcomes
- `POST /api/outcomes` - Create new outcome
- `PUT /api/outcomes/:id` - Update outcome
- `DELETE /api/outcomes/:id` - Delete outcome

### Proposals
- `GET /api/proposals` - Get all proposals
- `GET /api/proposals/:id` - Get specific proposal
- `POST /api/proposals/generate` - Generate new proposals

### Reactions
- `POST /api/reactions` - React to a proposal
- `GET /api/reactions/:proposalId` - Get reactions for a proposal

### User Data
- `GET /api/users/:id/data` - Export user data
- `DELETE /api/users/:id` - Delete user account
- `PUT /api/users/:id/api-key` - Update user's API key

## Enhanced Features (User API Key)
When users provide their own OpenRouter API key, they get:
- **Longer Conversations**: 100 messages vs 10 message limit with Home Mind
- **Advanced AI Analysis**: Deeper semantic understanding of outcomes and preferences
- **Sophisticated Proposals**: Multi-step reasoning and creative solution synthesis
- **Intelligent Learning**: AI-powered pattern recognition from reactions and feedback
- **Priority Processing**: Faster response times and more AI compute resources
- **Cross-Domain Innovation**: AI explores solutions from different fields and contexts

This simplified design focuses on validating the core concept of outcome-oriented deliberation with minimal technical complexity.