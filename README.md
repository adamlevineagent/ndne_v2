# NDNE V2 Platform

A revolutionary collective intelligence platform that enables outcome-oriented deliberation through AI-mediated solution discovery.

## Current Status

✅ **Foundation Complete** - Project structure, database schema, and development environment setup  
✅ **Authentication System Complete** - Full user registration, login, JWT tokens, and protected routes  
✅ **Home Mind Conversation Interface Complete** - AI-powered chat system with OpenRouter integration  
✅ **Outcome Collection System Complete** - Full CRUD operations, AI extraction, and refinement capabilities  
✅ **AI-Powered Proposal Generation Complete** - Semantic similarity analysis and intelligent proposal synthesis  
✅ **Reaction System Complete** - Full backend API with comprehensive reaction management and statistics  
✅ **Proposal Viewing Interface Complete** - Frontend components for viewing and managing proposals  
🚧 **Proposal Reaction Interface** - Need to integrate reaction capture UI with backend API  
🔄 **Next: Complete Reaction UI** - Add like/dislike buttons and reaction display to proposal cards

## Project Structure

```
/
├── backend/                 # Node.js/Express API
│   ├── src/
│   │   ├── config/         # Database configuration
│   │   ├── middleware/     # Authentication middleware
│   │   ├── routes/         # API route handlers
│   │   ├── services/       # Business logic (AuthService)
│   │   └── index.ts        # Main server with security middleware
│   ├── migrations/         # Database schema migrations
│   │   └── 1640995200000_create-initial-schema.js
│   └── package.json        # Dependencies and scripts
├── frontend/               # React application with Vite
│   ├── src/
│   │   ├── components/     # UI components (AuthForm, Chat)
│   │   ├── pages/          # HomePage with authentication and chat
│   │   ├── services/       # API client with auth and conversation services
│   │   ├── types/          # TypeScript interfaces
│   │   └── App.tsx         # Main app with routing
│   └── package.json        # React dependencies
└── .kiro/                  # Kiro specifications and steering
    └── specs/ndne-v2-platform/  # Requirements, design, tasks
```

## Quick Start

### Prerequisites
- Node.js 18+ 
- PostgreSQL 12+
- npm or yarn

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your database URL and other settings
```

4. Set up PostgreSQL database:
```bash
createdb ndne_v2
```

5. Run database migrations:
```bash
npm run migrate:up
```

6. Start development server:
```bash
npm run dev
```

The backend will run on http://localhost:3000

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start development server:
```bash
npm start
```

The frontend will run on http://localhost:3001

## Development

### Database Migrations

Create a new migration:
```bash
cd backend
npm run migrate:create -- migration-name
```

Run migrations:
```bash
npm run migrate:up
```

Rollback migrations:
```bash
npm run migrate:down
```

### Testing

Backend tests:
```bash
cd backend
npm test
```

### System Testing and Debugging

The platform includes comprehensive testing tools for different components:

#### Proposal System Testing
```bash
cd backend

# Test basic proposal functionality
node test-proposal-basic.js

# Debug proposal generation with detailed logging
node debug-proposal-generation.js

# Test proposal API endpoints
node test-proposal-api.js
```

#### Reaction System Testing
```bash
cd backend

# Test reaction API endpoints
node test-reaction-endpoints.js

# Test reaction functionality with live server
node test-reaction-api.js
```

These tools help diagnose issues with:
- AI-powered outcome similarity analysis
- Proposal generation algorithms
- Reaction capture and statistics
- Database operations and data integrity
- OpenRouter API integration

## Environment Variables

See `backend/.env.example` for required environment variables:

- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Secret key for JWT tokens
- `OPENROUTER_API_KEY`: API key for AI services
- `PORT`: Server port (default: 3000)
- `CORS_ORIGIN`: Frontend URL for CORS (default: http://localhost:3001)

## API Endpoints

### Health Check
- `GET /health` - System health status
- `GET /api/health` - API service health status

### Authentication ✅ Complete
- `POST /api/auth/register` - User registration with email/password validation
  - Requires: `{ email, password }` (password min 8 chars)
  - Returns: `{ user, token }` with JWT token (7-day expiry)
- `POST /api/auth/login` - User login with JWT token response
  - Requires: `{ email, password }`
  - Returns: `{ user, token }` with authentication token
- `GET /api/auth/me` - Get current user profile (requires Bearer token)
  - Headers: `Authorization: Bearer <token>`
  - Returns: `{ user: { id, email, createdAt } }`
- `POST /api/auth/validate` - Validate JWT token
  - Headers: `Authorization: Bearer <token>`
  - Returns: `{ valid: true, user }`

### Conversations ✅ Complete
- `GET /api/conversations` - Get all conversations for authenticated user
  - Headers: `Authorization: Bearer <token>`
  - Returns: `{ conversations: [{ id, messages, createdAt }] }`
- `GET /api/conversations/:id` - Get specific conversation by ID
  - Headers: `Authorization: Bearer <token>`
  - Returns: `{ conversation: { id, messages, createdAt } }`
- `POST /api/conversations` - Create new conversation with Home Mind AI
  - Headers: `Authorization: Bearer <token>`
  - Requires: `{ message: string }` (max 2000 chars)
  - Returns: `{ conversation: { id, messages, createdAt } }`
- `POST /api/conversations/:id/messages` - Add message to existing conversation
  - Headers: `Authorization: Bearer <token>`
  - Requires: `{ message: string }` (max 2000 chars)
  - Returns: `{ conversation: { id, messages, createdAt } }`
- `DELETE /api/conversations/:id` - Delete conversation
  - Headers: `Authorization: Bearer <token>`
  - Returns: `{ message: "Conversation deleted successfully" }`

### Outcomes ✅ Complete
- `GET /api/outcomes/:userId` - Get all outcomes for authenticated user
  - Headers: `Authorization: Bearer <token>`
  - Returns: `{ outcomes: [{ id, statement, importance, extractedFromConversation, refinementHistory, createdAt, updatedAt }] }`
- `POST /api/outcomes` - Create new outcome
  - Headers: `Authorization: Bearer <token>`
  - Requires: `{ statement: string, importance: number }` (importance 1-5)
  - Returns: `{ outcome: { id, statement, importance, ... } }`
- `PUT /api/outcomes/:id` - Update existing outcome
  - Headers: `Authorization: Bearer <token>`
  - Requires: `{ statement?: string, importance?: number }`
  - Returns: `{ outcome: { id, statement, importance, ... } }`
- `DELETE /api/outcomes/:id` - Delete outcome
  - Headers: `Authorization: Bearer <token>`
  - Returns: `{ message: "Outcome deleted successfully" }`
- `POST /api/outcomes/extract` - Extract outcomes from conversation using AI
  - Headers: `Authorization: Bearer <token>`
  - Requires: `{ conversationMessages: Array<{role, content}> }`
  - Returns: `{ outcomes: Array<outcome> }`
- `POST /api/outcomes/:id/refine` - AI-powered outcome refinement
  - Headers: `Authorization: Bearer <token>`
  - Returns: `{ outcome: { id, statement, importance, ... } }`

### Proposals ✅ Complete
- `POST /api/proposals/generate` - Generate proposals using AI-powered outcome similarity analysis
  - Headers: `Authorization: Bearer <token>`
  - Optional: `{ minSimilarityScore: number, maxUsers: number }` (defaults: 0.6, 10)
  - Returns: `{ success: true, data: { proposals: Array<proposal>, count: number } }`
- `GET /api/proposals` - Get all generated proposals
  - Headers: `Authorization: Bearer <token>`
  - Returns: `{ success: true, data: { proposals: Array<proposal>, count: number } }`
- `GET /api/proposals/:id` - Get specific proposal by ID
  - Headers: `Authorization: Bearer <token>`
  - Returns: `{ success: true, data: { proposal: { id, title, description, similarityAnalysis, contributingUsers, createdAt } } }`

### Reactions ✅ Complete
- `POST /api/reactions` - Submit user reaction to a proposal (like/dislike with optional comment)
  - Headers: `Authorization: Bearer <token>`
  - Requires: `{ proposalId: string, response: 'like'|'dislike', comment?: string }`
  - Returns: `{ success: true, data: { id, userId, proposalId, response, comment, createdAt } }`
- `GET /api/reactions/:proposalId` - Get all reactions for a specific proposal with statistics
  - Headers: `Authorization: Bearer <token>`
  - Returns: `{ success: true, data: { reactions: Array<reaction>, stats: { totalReactions, likes, dislikes, likePercentage } } }`
- `GET /api/reactions/:proposalId/user` - Get current user's reaction to a specific proposal
  - Headers: `Authorization: Bearer <token>`
  - Returns: `{ success: true, data: reaction | null }`
- `DELETE /api/reactions/:proposalId` - Delete current user's reaction to a proposal
  - Headers: `Authorization: Bearer <token>`
  - Returns: `{ success: true, message: "Reaction deleted successfully" }`
- `GET /api/reactions/user/all` - Get all reactions by the current user
  - Headers: `Authorization: Bearer <token>`
  - Returns: `{ success: true, data: Array<reaction> }`

### User Data Management (Planned)
- `GET /api/users/:id/data` - Export user data
- `DELETE /api/users/:id` - Delete user account
- `PUT /api/users/:id/api-key` - Update user's API key

## Authentication & Security

The platform implements a robust authentication system with the following features:

### Security Features ✅ Implemented
- **Password Security**: bcrypt hashing with configurable rounds (default: 12)
- **JWT Tokens**: 7-day expiry with secure secret key validation
- **Input Validation**: Email format validation and password strength requirements
- **Rate Limiting**: 100 requests per 15-minute window per IP
- **CORS Protection**: Configurable origin restrictions
- **Security Headers**: Helmet.js for standard security headers
- **Error Handling**: Secure error messages that don't leak sensitive information

### Authentication Flow
1. **Registration**: User provides email/password → System validates → Password hashed → User created → JWT token returned
2. **Login**: User provides credentials → System validates → Password verified → JWT token returned
3. **Protected Routes**: Client sends Bearer token → Server validates → Request processed or rejected

### Middleware
- `authenticateToken`: Requires valid JWT token, rejects unauthorized requests
- `optionalAuth`: Accepts requests with or without tokens (for future features)

## Technology Stack

### Backend
- Node.js with Express
- TypeScript
- PostgreSQL with UUID primary keys
- JWT authentication with bcrypt
- OpenRouter API integration with Claude 3 Haiku
- Security: Helmet, CORS, Rate Limiting

### Frontend  
- React with TypeScript
- React Router for navigation
- Axios for API calls
- Responsive CSS design

## AI-Powered Proposal Generation System

### Current Implementation Status 🚧

The proposal generation system has been implemented with the following components:

#### ✅ Completed Features
- **ProposalService**: Complete TypeScript service with AI-powered similarity analysis
- **Database Schema**: Full proposal tables with similarity analysis storage (JSONB)
- **API Endpoints**: REST endpoints for generation, retrieval, and individual proposal access
- **AI Integration**: Semantic similarity analysis using OpenRouter/Claude
- **Coalition Building**: Groups users with similar outcomes (configurable similarity threshold)

#### 🔧 Implementation Details
- **Similarity Analysis**: AI compares outcomes using semantic understanding, not just keyword matching
- **Proposal Generation**: AI synthesizes solutions that address multiple users' similar outcomes
- **Database Storage**: Proposals stored with full similarity analysis metadata and user relationships
- **Configurable Parameters**: Adjustable similarity thresholds and maximum users per proposal

#### ⚠️ Known Issues Requiring Debug
- **Generation Algorithm**: May not be finding sufficient similar outcomes to create proposals
- **AI Response Parsing**: JSON parsing from AI responses may be inconsistent
- **Similarity Scoring**: Threshold settings may be too restrictive for initial testing
- **Error Handling**: Need better graceful degradation when AI services are unavailable

#### 🧪 Debugging Tools Available
- `test-proposal-basic.js`: Tests core functionality and database operations
- `debug-proposal-generation.js`: Detailed logging of the proposal generation process
- `test-proposal-api.js`: API endpoint testing and validation

### Database Schema

The proposal system uses these tables:
- `proposals`: Core proposal data with title, description, and similarity analysis (JSONB)
- `proposal_users`: Junction table linking proposals to contributing users
- `reactions`: User feedback on proposals (like/dislike with comments)

## Next Steps

With the core platform functionality implemented, the immediate priorities are:

1. **Complete Reaction UI Integration** - Connect the reaction capture interface to the backend API
   - Add like/dislike buttons to ProposalCard component
   - Display reaction statistics and user's current reaction
   - Implement reaction submission and updates

2. **Enhanced Proposal Features** - Improve the proposal experience
   - Show outcome-proposal connections in the UI
   - Display similarity analysis and shared themes
   - Add explanatory text for how proposals benefit users

3. **AI Learning System** - Implement continuous improvement
   - AI system that learns from user reactions to improve proposals
   - Iterative outcome distillation based on feedback patterns
   - Enhanced proposal generation using reaction data

4. **User Dashboard and Navigation** - Complete the user experience
   - Main dashboard showing user's outcomes and recent proposals
   - Enhanced navigation between chat, outcomes, proposals, and settings
   - User profile management and settings

5. **API Key Management** - Enable enhanced features
   - Dual-tier system (platform vs user API keys)
   - Settings UI for API key configuration
   - Enhanced AI capabilities for users with their own keys

6. **Privacy and Security Enhancements** - Production readiness
   - Data export and account deletion endpoints
   - Advanced security measures and input validation
   - Production deployment configuration