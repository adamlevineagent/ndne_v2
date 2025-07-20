import React from 'react';
import { Proposal } from '../types';

interface ProposalCardProps {
  proposal: Proposal;
  onViewDetails?: (proposal: Proposal) => void;
}

const ProposalCard: React.FC<ProposalCardProps> = ({ proposal, onViewDetails }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const truncateDescription = (text: string, maxLength: number = 200) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  };

  return (
    <div className="proposal-card">
      <div className="proposal-header">
        <h3 className="proposal-title">{proposal.title}</h3>
        <div className="proposal-meta">
          <span className="proposal-date">
            {formatDate(proposal.createdAt.toString())}
          </span>
        </div>
      </div>
      
      <div className="proposal-content">
        <p className="proposal-description">
          {truncateDescription(proposal.description)}
        </p>
      </div>
      
      <div className="proposal-actions">
        {onViewDetails && (
          <button 
            onClick={() => onViewDetails(proposal)}
            className="btn btn-outline btn-sm"
          >
            View Details
          </button>
        )}
      </div>
    </div>
  );
};

export default ProposalCard;