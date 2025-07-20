import React from 'react';
import { Proposal } from '../types';
import ProposalCard from './ProposalCard';

interface ProposalListProps {
  proposals: Proposal[];
  isLoading?: boolean;
  onViewDetails?: (proposal: Proposal) => void;
  onGenerateProposals?: () => void;
}

const ProposalList: React.FC<ProposalListProps> = ({ 
  proposals, 
  isLoading = false, 
  onViewDetails,
  onGenerateProposals 
}) => {
  if (isLoading) {
    return (
      <div className="proposal-list loading">
        <div className="loading">Loading proposals...</div>
      </div>
    );
  }

  if (proposals.length === 0) {
    return (
      <div className="proposal-list empty">
        <div className="empty-state">
          <h3>No Proposals Available</h3>
          <p>
            There are currently no proposals to display. Proposals are generated based on 
            similar outcomes from multiple users.
          </p>
          {onGenerateProposals && (
            <button 
              onClick={onGenerateProposals}
              className="btn btn-primary"
            >
              Generate New Proposals
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="proposal-list">
      <div className="proposal-list-header">
        <h3>Available Proposals ({proposals.length})</h3>
        {onGenerateProposals && (
          <button 
            onClick={onGenerateProposals}
            className="btn btn-secondary btn-sm"
          >
            Generate More
          </button>
        )}
      </div>
      
      <div className="proposals">
        {proposals.map((proposal) => (
          <ProposalCard
            key={proposal.id}
            proposal={proposal}
            onViewDetails={onViewDetails}
          />
        ))}
      </div>
    </div>
  );
};

export default ProposalList;