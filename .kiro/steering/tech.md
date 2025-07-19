# Technology Stack & Architecture

## Tech Stack

### Backend
- **Runtime**: Node.js with Express framework
- **Language**: TypeScript for type safety
- **Database**: PostgreSQL with UUID primary keys
- **Authentication**: JWT tokens with bcrypt password hashing
- **AI Integration**: OpenRouter API for LLM capabilities

### Frontend
- **Framework**: React with TypeScript
- **Styling**: Responsive design for mobile compatibility
- **State Management**: React hooks and context

### Infrastructure
- **Deployment**: Single server (DigitalOcean/Heroku recommended)
- **Database Hosting**: Cloud PostgreSQL (DigitalOcean/Heroku)
- **Frontend Hosting**: Static hosting (Vercel/Netlify)
- **Security**: HTTPS, CORS configuration, rate limiting

## Architecture Patterns

### Three-Layer Architecture
1. **Frontend Layer**: React interface for user interactions
2. **Backend Layer**: Express API with business logic
3. **Database Layer**: PostgreSQL for data persistence

### AI Integration Pattern
- Dual API key system: platform-provided (10k tokens/day) + user-provided (unlimited)
- OpenRouter integration for LLM capabilities
- Graceful degradation when AI services unavailable

### Data Flow
```
User Input → Home Mind AI → Outcome Storage → 
Outcome Matching → Proposal Generation → User Reactions → 
Reaction Learning → Improved Proposals
```

## Common Commands

### Development Setup
```bash
# Backend setup
npm install
npm run dev

# Frontend setup (in separate terminal)
cd frontend
npm install
npm start

# Database setup
createdb ndne_v2
npm run migrate
```

### Testing
```bash
# Run unit tests
npm test

# Run integration tests
npm run test:integration

# Manual smoke tests
npm run test:smoke
```

### Deployment
```bash
# Build for production
npm run build

# Deploy backend (example with Heroku)
npm run deploy:backend
# Runs: git push heroku main && heroku run npm run migrate

# Deploy frontend (example with Vercel)
npm run deploy:frontend
# Runs: vercel --prod

# Environment setup
cp .env.example .env.production
# Configure: DATABASE_URL, OPENROUTER_API_KEY, JWT_SECRET
```

## Database Migrations

### Migration Tool
- **Tool**: node-pg-migrate for PostgreSQL schema management
- **Location**: `/backend/migrations/` directory
- **Naming**: Timestamp-based (e.g., `1640995200000_create-users-table.js`)

### Migration Commands
```bash
# Create new migration
npm run migrate:create -- create-users-table

# Run migrations
npm run migrate:up

# Rollback migrations
npm run migrate:down
```

## AI Prompt Templates

### Outcome Extraction
```typescript
const OUTCOME_EXTRACTION_PROMPT = `
Extract desired outcomes from this conversation. Focus on "I want a world where..." statements.
Format as: { statement: string, importance: 1-5, timeHorizon: string }

Conversation: {conversation}
`;
```

### Proposal Generation
```typescript
const PROPOSAL_GENERATION_PROMPT = `
Generate a proposal that addresses these similar outcomes from multiple users:
{outcomes}

Create a solution that:
1. Addresses at least 3 outcomes
2. Explains clear benefits
3. Acknowledges tradeoffs
4. Suggests implementation approach
`;
```

### Similarity Analysis
```typescript
const SIMILARITY_ANALYSIS_PROMPT = `
Analyze semantic similarity between these outcomes:
User A: {outcomeA}
User B: {outcomeB}

Return similarity score (0-1) and shared themes.
`;
```

## Environment Variables

### Required Configuration
```bash
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/ndne_v2

# AI Integration
OPENROUTER_API_KEY=your_openrouter_key
PLATFORM_API_KEY=platform_provided_key

# Authentication
JWT_SECRET=your_jwt_secret_key
BCRYPT_ROUNDS=12

# API Configuration
PORT=3000
NODE_ENV=production
CORS_ORIGIN=https://your-frontend-domain.com
```

## Performance Considerations

- Batch processing for AI operations
- Smart caching with LRU and Redis
- Horizontal scaling with auto-scaling agent instances
- Database query optimization with proper indexing