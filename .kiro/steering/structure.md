# Project Structure & Organization

## Repository Structure

```
/
├── .kiro/                    # Kiro configuration
│   ├── specs/               # Project specifications
│   └── steering/            # AI assistant guidance
├── backend/                 # Node.js/Express API
│   ├── src/
│   │   ├── routes/          # API endpoints
│   │   ├── models/          # Database models
│   │   ├── services/        # Business logic
│   │   ├── middleware/      # Auth, validation, etc.
│   │   └── utils/           # Helper functions
│   ├── migrations/          # Database migrations
│   └── tests/               # Backend tests
├── frontend/                # React application
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/           # Page components
│   │   ├── services/        # API client functions
│   │   ├── hooks/           # Custom React hooks
│   │   └── utils/           # Frontend utilities
│   └── public/              # Static assets
├── docs/                    # Documentation
└── scripts/                 # Build and deployment scripts
```

## Core Data Models

### Primary Entities
- **Users**: Authentication and profile data
- **Outcomes**: User's desired world states with importance ratings
- **Proposals**: AI-generated solutions addressing multiple outcomes
- **Reactions**: User feedback on proposals (like/dislike + comments)
- **Conversations**: Home Mind chat history

### Relationships
- Users have many Outcomes (1:N)
- Proposals connect to multiple Users via proposal_users (N:N)
- Users react to Proposals via Reactions (N:N with attributes)
- Users have Conversations with their Home Mind (1:N)

## API Organization

### Endpoint Structure
```
/api/auth/*          # Authentication (register, login)
/api/users/*         # User management and data export
/api/conversations/* # Home Mind chat interface
/api/outcomes/*      # Outcome CRUD operations
/api/proposals/*     # Proposal generation and viewing
/api/reactions/*     # Proposal feedback system
```

## Component Architecture

### Frontend Components
- **Layout**: Navigation, header, responsive containers
- **Auth**: Login, register, protected routes
- **Chat**: Home Mind conversation interface
- **Outcomes**: Collection forms, importance ratings
- **Proposals**: Display, explanation, reaction capture
- **Dashboard**: User overview, recent activity

### Backend Services
- **AuthService**: JWT handling, password management
- **AIService**: OpenRouter integration, prompt management
- **OutcomeService**: Analysis, similarity matching
- **ProposalService**: Generation, coalition building
- **ReactionService**: Learning, pattern recognition

## Development Conventions

### File Naming
- Use kebab-case for files and directories
- Component files use PascalCase (e.g., `HomePage.tsx`)
- Service files use camelCase with Service suffix
- Database migrations use timestamp prefixes

### Code Organization
- Keep components small and focused on single responsibility
- Extract business logic into services
- Use TypeScript interfaces for all data structures
- Implement proper error boundaries and handling
- Follow REST conventions for API endpoints

### Database Conventions
- Use UUIDs for all primary keys
- Include created_at timestamps on all tables
- Use snake_case for column names
- Implement proper foreign key constraints
- Add indexes for frequently queried columns