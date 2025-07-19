import React, { useState, useEffect } from 'react';
import AuthForm from '../components/AuthForm';
import Chat from '../components/Chat';
import { authService } from '../services/api';

const HomePage: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    const token = localStorage.getItem('authToken');
    if (token) {
      try {
        const response = await authService.me();
        setUser(response.user);
      } catch (error) {
        localStorage.removeItem('authToken');
      }
    }
    setLoading(false);
  };

  const handleAuthSuccess = (_token: string, userData: any) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    setUser(null);
  };

  const toggleAuthMode = () => {
    setAuthMode(authMode === 'login' ? 'register' : 'login');
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (!user) {
    return (
      <div className="home-page">
        <div className="hero-section">
          <h1>Welcome to NDNE V2</h1>
          <p className="hero-subtitle">
            Outcome-oriented deliberation through AI-mediated solution discovery
          </p>
          
          <div className="features">
            <div className="feature">
              <h3>🤖 Home Mind AI</h3>
              <p>Your personal AI agent that learns your values and desired outcomes through conversation.</p>
            </div>
            
            <div className="feature">
              <h3>🧠 Collective Intelligence</h3>
              <p>AI agents collaborate to discover solutions that satisfy multiple stakeholders without conflict.</p>
            </div>
            
            <div className="feature">
              <h3>🎯 Outcome-Focused</h3>
              <p>Express what you want to see in the world, not just what you oppose or fear.</p>
            </div>
          </div>
        </div>

        <div className="auth-section">
          <AuthForm 
            mode={authMode}
            onSuccess={handleAuthSuccess}
            onToggleMode={toggleAuthMode}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="home-page authenticated">
      <div className="user-header">
        <div className="user-info">
          <span>Welcome, {user.email}</span>
        </div>
        <button onClick={handleLogout} className="logout-btn">
          Sign Out
        </button>
      </div>
      
      <Chat user={user} />
    </div>
  );
};

export default HomePage;