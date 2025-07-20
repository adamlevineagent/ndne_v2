import React, { useState, useEffect } from 'react';
import { proposalService } from '../services/api';
import { Proposal } from '../types';
import ProposalList from '../components/ProposalList';

const ProposalsPage: React.FC = () => {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);

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
      loadProposals();
    } else {
      setError('Please log in to view proposals');
      setIsLoading(false);
    }
  }, [userId]);

  const loadProposals = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await proposalService.getProposals();
      if (response.proposals) {
        setProposals(response.proposals);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load proposals');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateProposals = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const response = await proposalService.generateProposals();
      if (response.proposals) {
        // Add new proposals to the existing list, avoiding duplicates
        const existingIds = new Set(proposals.map(p => p.id));
        const newProposals = response.proposals.filter(p => !existingIds.has(p.id));
        setProposals(prev => [...newProposals, ...prev]);
        
        if (newProposals.length > 0) {
          alert(`Generated ${newProposals.length} new proposals!`);
        } else {
          alert('No new proposals were generated. This might mean there aren\'t enough similar outcomes to create new proposals.');
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to generate proposals');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleViewDetails = (proposal: Proposal) => {
    setSelectedProposal(proposal);
  };

  const handleCloseDetails = () => {
    setSelectedProposal(null);
  };

  if (!userId) {
    return (
      <div className="proposals-page">
        <div className="error-message">
          Please log in to view proposals.
        </div>
      </div>
    );
  }

  return (
    <div className="proposals-page">
      <div className="page-header">
        <h1>Proposals</h1>
        <p className="page-description">
          AI-generated solutions that address multiple users' desired outcomes. 
          These proposals are created by analyzing similar outcomes and finding win-win approaches.
        </p>
      </div>

      <div className="page-actions">
        <button
          onClick={handleGenerateProposals}
          disabled={isGenerating || isLoading}
          className="btn btn-primary"
        >
          {isGenerating ? 'Generating...' : 'Generate New Proposals'}
        </button>
        
        <button
          onClick={loadProposals}
          disabled={isLoading}
          className="btn btn-secondary"
        >
          {isLoading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="proposals-section">
        <ProposalList
          proposals={proposals}
          isLoading={isLoading}
          onViewDetails={handleViewDetails}
          onGenerateProposals={handleGenerateProposals}
        />
      </div>

      {selectedProposal && (
        <div className="proposal-modal-overlay" onClick={handleCloseDetails}>
          <div className="proposal-modal" onClick={(e) => e.stopPropagation()}>
            <div className="proposal-modal-header">
              <h2>{selectedProposal.title}</h2>
              <button 
                onClick={handleCloseDetails}
                className="modal-close-btn"
                aria-label="Close"
              >
                ×
              </button>
            </div>
            
            <div className="proposal-modal-content">
              <div className="proposal-meta">
                <span className="proposal-date">
                  Created: {new Date(selectedProposal.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
              
              <div className="proposal-full-description">
                <h3>Description</h3>
                <p>{selectedProposal.description}</p>
              </div>
            </div>
            
            <div className="proposal-modal-actions">
              <button 
                onClick={handleCloseDetails}
                className="btn btn-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProposalsPage;