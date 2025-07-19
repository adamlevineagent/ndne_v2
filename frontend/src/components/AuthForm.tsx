import React, { useState } from 'react';
import { authService } from '../services/api';

interface AuthFormProps {
  mode: 'login' | 'register';
  onSuccess: (token: string, user: any) => void;
  onToggleMode: () => void;
}

const AuthForm: React.FC<AuthFormProps> = ({ mode, onSuccess, onToggleMode }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = mode === 'login' 
        ? await authService.login(email, password)
        : await authService.register(email, password);

      if (response.token && response.user) {
        localStorage.setItem('authToken', response.token);
        onSuccess(response.token, response.user);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-form">
      <h2>{mode === 'login' ? 'Sign In' : 'Create Account'}</h2>
      
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="password">Password:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            disabled={loading}
          />
        </div>
        
        <button type="submit" disabled={loading}>
          {loading ? 'Please wait...' : (mode === 'login' ? 'Sign In' : 'Create Account')}
        </button>
      </form>
      
      <p>
        {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
        <button type="button" onClick={onToggleMode} className="link-button">
          {mode === 'login' ? 'Sign up' : 'Sign in'}
        </button>
      </p>
    </div>
  );
};

export default AuthForm;