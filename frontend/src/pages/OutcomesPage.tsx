import React, { useState, useEffect } from 'react';
import { outcomeService, conversationService } from '../services/api';
import { Outcome } from '../types';
import OutcomeForm from '../components/OutcomeForm';
import OutcomeList from '../components/OutcomeList';

const OutcomesPage: React.FC = () => {
  const [outcomes, setOutcomes] = useState<Outcome[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);

  // Get user ID from localStorage (set during login)
  const getUserId = () => {
    const token = localStorage.getItem('authToken');
    if (!token) return null;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.userId;
    } catch {
      return null;
    }
  };

  const userId = getUserId();

  useEffect(() => {
    if (userId) {
      loadOutcomes();
    } else {
      setError('Please log in to view your outcomes');
      setIsLoading(false);
    }
  }, [userId]);

  const loadOutcomes = async () => {
    if (!userId) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await outcomeService.getOutcomes(userId);
      if (response.outcomes) {
        setOutcomes(response.outcomes);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load outcomes');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOutcomeCreated = (newOutcome: Outcome) => {
    setOutcomes(prev => [newOutcome, ...prev]);
    setShowForm(false);
  };

  const handleOutcomesChange = (updatedOutcomes: Outcome[]) => {
    setOutcomes(updatedOutcomes);
  };

  const handleExtractFromConversations = async () => {
    if (!userId) return;

    setIsExtracting(true);
    setError(null);

    try {
      // Get recent conversations
      const conversationsResponse = await conversationService.getConversations();
      
      if (conversationsResponse.conversations && conversationsResponse.conversations.length > 0) {
        // Use the most recent conversation for extraction
        const recentConversation = conversationsResponse.conversations[0];
        
        if (recentConversation.messages && recentConversation.messages.length > 0) {
          const extractResponse = await outcomeService.extractOutcomes(recentConversation.messages);
          
          if (extractResponse.outcomes && extractResponse.outcomes.length > 0) {
            // Add extracted outcomes to the list
            setOutcomes(prev => [...extractResponse.outcomes, ...prev]);
            alert(`Extracted ${extractResponse.outcomes.length} outcomes from your recent conversation!`);
          } else {
            alert('No clear outcomes found in your recent conversations. Try having a conversation about what you want to see in the world.');
          }
        } else {
          alert('No conversation messages found to extract from.');
        }
      } else {
        alert('No conversations found. Start a conversation with your Home Mind first.');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to extract outcomes from conversations');
    } finally {
      setIsExtracting(false);
    }
  };

  if (!userId) {
    return (
      <div className="outcomes-page">
        <div className="error-message">
          Please log in to manage your outcomes.
        </div>
      </div>
    );
  }

  return (
    <div className="outcomes-page">
      <div className="page-header">
        <h1>Your Outcomes</h1>
        <p className="page-description">
          Express what you want to see in the world. These outcomes help the AI understand your values 
          and generate proposals that align with what you truly care about.
        </p>
      </div>

      <div className="page-actions">
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn btn-primary"
          disabled={isLoading}
        >
          {showForm ? 'Cancel' : 'Add New Outcome'}
        </button>
        
        <button
          onClick={handleExtractFromConversations}
          disabled={isExtracting || isLoading}
          className="btn btn-secondary"
        >
          {isExtracting ? 'Extracting...' : 'Extract from Conversations'}
        </button>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {showForm && (
        <div className="form-section">
          <OutcomeForm
            onOutcomeCreated={handleOutcomeCreated}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      <div className="outcomes-section">
        {isLoading ? (
          <div className="loading">Loading your outcomes...</div>
        ) : (
          <OutcomeList
            userId={userId}
            outcomes={outcomes}
            onOutcomesChange={handleOutcomesChange}
          />
        )}
      </div>
    </div>
  );
};

export default OutcomesPage;