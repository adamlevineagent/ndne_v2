#!/bin/bash

# NDNE V2 Platform Setup Script

echo "🚀 Setting up NDNE V2 Platform..."

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL is not installed. Please install PostgreSQL first."
    echo "   macOS: brew install postgresql"
    echo "   Ubuntu: sudo apt-get install postgresql postgresql-contrib"
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

echo "✅ Prerequisites check passed"

# Backend setup
echo "📦 Setting up backend..."
cd backend

# Install dependencies
npm install

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    cp .env.example .env
    echo "📝 Created .env file from template. Please configure your settings."
fi

# Build backend
npm run build

cd ..

# Frontend setup
echo "🎨 Setting up frontend..."
cd frontend

# Install dependencies
npm install

# Build frontend
npm run build

cd ..

echo "✅ Setup completed!"
echo ""
echo "Next steps:"
echo "1. Configure backend/.env with your database URL and secrets"
echo "2. Create PostgreSQL database: createdb ndne_v2"
echo "3. Run database migrations: cd backend && npm run migrate:up"
echo "4. Start backend: cd backend && npm run dev"
echo "5. Start frontend: cd frontend && npm start"
echo ""
echo "The application will be available at:"
echo "- Frontend: http://localhost:3001"
echo "- Backend API: http://localhost:3000"