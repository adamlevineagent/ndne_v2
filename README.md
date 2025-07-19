# NDNE V2 Platform

A revolutionary collective intelligence platform that enables outcome-oriented deliberation through AI-mediated solution discovery.

## Current Status

✅ **Foundation & Authentication Complete** - Project structure, database schema, and full authentication system are implemented and ready. Next: implementing Home Mind conversation interface.

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
│   │   ├── components/     # UI components (planned)
│   │   ├── pages/          # HomePage with API status check
│   │   ├── services/       # API client (planned)
│   │   ├── types/          # TypeScript interfaces (planned)
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

### Authentication
- `POST /api/auth/register` - User registration with email/password
- `POST /api/auth/login` - User login with JWT token response
- `GET /api/auth/me` - Get current user profile (requires auth)
- `POST /api/auth/validate` - Validate JWT token

### Coming Soon
- Conversation endpoints for Home Mind AI
- Outcome collection and management
- AI-powered proposal generation
- User reaction and feedback system

## Technology Stack

### Backend
- Node.js with Express
- TypeScript
- PostgreSQL with UUID primary keys
- JWT authentication
- OpenRouter API integration

### Frontend  
- React with TypeScript
- React Router for navigation
- Axios for API calls
- Responsive CSS design

## Next Steps

With foundation and authentication complete, the next development phases are:

1. **Home Mind Conversation Interface** - AI-powered chat system for outcome discovery
2. **Outcome Collection System** - Forms and storage for user desired outcomes
3. **AI-Powered Proposal Generation** - System to match outcomes and generate solutions
4. **User Reaction System** - Feedback collection and learning from user responses
5. **Dashboard and Navigation** - User interface for managing outcomes and viewing proposals