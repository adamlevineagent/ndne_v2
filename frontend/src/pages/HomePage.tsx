import React, { useState, useEffect } from 'react';
import axios from 'axios';

const HomePage: React.FC = () => {
  const [apiStatus, setApiStatus] = useState<string>('Checking...');

  useEffect(() => {
    const checkApiHealth = async () => {
      try {
        const response = await axios.get('/api/health');
        setApiStatus(`API Connected: ${response.data.status}`);
      } catch (error) {
        setApiStatus('API Connection Failed');
        console.error('API health check failed:', error);
      }
    };

    checkApiHealth();
  }, []);

  return (
    <div className="home-page">
      <h2>Welcome to NDNE V2</h2>
      <p>
        A revolutionary collective intelligence platform that enables outcome-oriented 
        deliberation through AI-mediated solution discovery.
      </p>
      
      <div className="status-section">
        <h3>System Status</h3>
        <p>Backend API: {apiStatus}</p>
      </div>

      <div className="features-section">
        <h3>Coming Soon</h3>
        <ul>
          <li>Home Mind AI Conversations</li>
          <li>Outcome Collection</li>
          <li>Proposal Generation</li>
          <li>Reaction System</li>
        </ul>
      </div>
    </div>
  );
};

export default HomePage;