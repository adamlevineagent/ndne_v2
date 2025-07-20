# NDNE V2 Platform

A revolutionary collective intelligence platform that enables outcome-oriented deliberation through AI-mediated solution discovery.

## Current Status

✅ **Foundation Complete** - Project structure, database schema, and development environment setup  
✅ **Authentication System Complete** - Full user registration, login, JWT tokens, and protected routes  
✅ **Home Mind Conversation Interface Complete** - AI-powered chat system with OpenRouter integration  
✅ **Outcome Collection System Complete** - Full CRUD operations, AI extraction, and refinement capabilities  
✅ **AI-Powered Proposal Generation Complete** - Semantic similarity analysis and intelligent proposal synthesis  
✅ **Proposal Viewing Interface Complete** - Frontend components for viewing and managing proposals  
✅ **Reaction Capture System Complete** - Full reaction interface with like/dislike buttons, comments, statistics, and user state management  
🔄 **Next: Outcome-Proposal Connections** - Show how proposals address user's specific outcomes and similarity analysis

> **📋 For detailed status information, see [docs/CURRENT_STATUS.md](docs/CURRENT_STATUS.md)**

The platform now supports the complete user journey from registration through conversation, outcome collection, proposal generation, and reaction capture. All core systems are functional and tested with comprehensive verification tools.

## Project Structure

```
/
├── backend/                 # Node.js/Express API
│   ├── src/
│   │   ├── config/         # Database configuration
│   │   ├── middleware/     # Authentication middleware
│   │   ├── routes/         # API route handlers (auth, conversations, outcomes, proposals, reactions)
│   │   ├── services/       # Business logic (auth, AI, conversation, outcome, proposal, reaction)
│   │   ├── tests/          # Unit tests for services
│   │   └── index.ts        # Main server with security middleware
│   ├── migrations/         # Database schema migrations
│   │   ├── 001_initial_schema.sql
│   │   ├── 002_create_outcomes_table.sql
│   │   └── 1640995200000_create-initial-schema.js
│   ├── test-*.js           # Integration and debugging test scripts
│   └── package.json        # Dependencies and scripts
├── frontend/               # React application with Vite
│   ├── src/
│   │   ├── components/     # UI components (AuthForm, Chat, ProposalCard, ProposalList, OutcomeForm, OutcomeList)
│   │   ├── pages/          # Page components (HomePage, OutcomesPage, ProposalsPage)
│   │   ├── services/       # API client services (auth, conversation, outcome, proposal, reaction)
│   │   ├── types/          # TypeScript interfaces
│   │   └── App.tsx         # Main app with routing and navigation
│   └── package.json        # React dependencies
├── scripts/                # Build and verification scripts
│   ├── setup.sh           # Environment setup script
│   ├── verify-implementation.js  # Task verification tool
│   └── test-reaction-frontend.js # Frontend testing script
├── docs/                   # Documentation
│   └── CURRENT_STATUS.md   # Detailed implementation status
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

#### Implementation Verification
```bash
# Verify Task 6.3 reaction interface implementation
node scripts/verify-implementation.js
```

#### Proposal System Testing
```bash
cd backend

# Test basic proposal functionality
node test-proposal-basic.js

# Debug proposal generation with detailed logging
node debug-proposal-generation.js

# Test proposal API endpoints
node test-proposal-api.js

# Test proposal generation end-to-end
node test-proposal-generation.js
```

#### Reaction System Testing
```bash
cd backend

# Test reaction API endpoints
node test-reaction-endpoints.js

# Test reaction functionality with live server
node test-reaction-api.js

# Test frontend reaction flow
node scripts/test-reaction-frontend.js
```

#### Authentication and Core Services Testing
```bash
cd backend

# Test authentication endpoints
node test-auth-endpoints.js

# Test AI service integration
node test-ai-service.js

# Test outcome management
node test-outcomes.js
```

#### Unit Testing
```bash
cd backend

# Run all unit tests
npm test

# Run specific test suites
npm test -- --testNamePattern="ReactionService"
npm test -- --testNamePattern="AuthService"
npm test -- --testNamePattern="ConversationService"

# Run tests with coverage
npm test -- --coverage
```

These tools help diagnose issues with:
- AI-powered outcome similarity analysis and semantic matching
- Proposal generation algorithms and coalition building
- Reaction capture, statistics, and user state management
- Database operations and data integrity validation
- OpenRouter API integration and error handling
- Frontend-backend integration and API communication
- User authentication, authorization, and session management
- Conversation flow and AI response processing

## Environment Variables

See `backend/.env.example` for required environment variables:

- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Secret key for JWT tokens
- `OPENROUTER_API_KEY`: API key for AI services
- `PORT`: Server port (default: 3000)
- `NODE_ENV`: Environment mode (development/production)
- `CORS_ORIGIN`: Frontend URL for CORS (default: http://localhost:3001)
- `BCRYPT_ROUNDS`: Password hashing rounds (default: 12)
- `RATE_LIMIT_WINDOW_MS`: Rate limiting window in milliseconds (default: 900000)
- `RATE_LIMIT_MAX_REQUESTS`: Max requests per window (default: 100)

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

## Reaction System Features ✅ Complete

The reaction capture interface is fully implemented with comprehensive functionality:

### Frontend Features
- **Like/Dislike Buttons**: Intuitive thumbs up/down interface on each proposal card
- **Comment System**: Optional comment field for detailed feedback on proposals
- **Reaction Statistics**: Real-time display of like/dislike counts and percentages
- **User Reaction Display**: Shows user's current reaction with ability to modify or remove
- **Update Functionality**: Users can change their reaction or add/edit comments
- **Error Handling**: Graceful error messages and loading states

### Backend Features
- **Complete API**: Full CRUD operations for reactions with comprehensive endpoints
- **Statistics Engine**: Real-time calculation of reaction statistics and trends
- **Data Integrity**: Proper foreign key relationships and constraint validation
- **User Isolation**: Secure access control ensuring users only see appropriate data

### UI/UX Features
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Visual Feedback**: Clear indication of user's current reaction state
- **Smooth Interactions**: Loading states and transitions for better user experience
- **Accessibility**: Proper ARIA labels and keyboard navigation support

## Next Steps

With the core platform functionality and reaction system complete, the immediate priorities are:

1. **Enhanced Proposal Features** - Show outcome-proposal connections
   - Display how each proposal addresses user's specific outcomes
   - Show similarity analysis and shared themes in proposal view
   - Add explanatory text for proposal benefits to individual users
   - Highlight which of user's outcomes are addressed by each proposal

2. **AI Learning System** - Implement continuous improvement
   - AI system that learns from user reactions to improve proposals
   - Iterative outcome distillation based on feedback patterns
   - Enhanced proposal generation using reaction data
   - Pattern recognition to better understand user preferences

3. **User Dashboard and Navigation** - Complete the user experience
   - Main dashboard showing user's outcomes and recent proposals
   - Enhanced navigation between chat, outcomes, proposals, and settings
   - User profile management and settings
   - Activity feed showing recent interactions and updates

4. **API Key Management** - Enable enhanced features
   - Dual-tier system (platform vs user API keys)
   - Settings UI for API key configuration
   - Enhanced AI capabilities for users with their own keys
   - Usage tracking and quota management

5. **Privacy and Security Enhancements** - Production readiness
   - Data export and account deletion endpoints
   - Advanced security measures and input validation
   - Production deployment configuration
   - Comprehensive audit logging

6. **Testing and Quality Assurance** - Ensure reliability
   - Comprehensive unit test coverage
   - Integration tests for key user flows
   - Performance testing and optimization
   - Error monitoring and alerting