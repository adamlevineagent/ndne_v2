import React, { useState, useEffect } from 'react';
import { Proposal, Reaction, ProposalOutcomeConnections } from '../types';
import { reactionService, proposalService } from '../services/api';

interface ProposalCardProps {
  proposal: Proposal;
  onViewDetails?: (proposal: Proposal) => void;
  showConnections?: boolean;
  currentUserId?: string;
}

const ProposalCard: React.FC<ProposalCardProps> = ({ 
  proposal, 
  onViewDetails, 
  showConnections = true,
  currentUserId 
}) => {
  const [userReaction, setUserReaction] = useState<Reaction | null>(null);
  const [reactionStats, setReactionStats] = useState<{
    totalReactions: number;
    likes: number;
    dislikes: number;
    likePercentage: number;
  } | null>(null);
  const [connections, setConnections] = useState<ProposalOutcomeConnections | null>(null);
  const [showConnectionDetails, setShowConnectionDetails] = useState(false);
  const [loadingConnections, setLoadingConnections] = useState(false);
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadUserReaction();
    loadReactionStats();
    if (showConnections && currentUserId) {
      loadConnections();
    }
  }, [proposal.id, currentUserId, showConnections]);

  const loadUserReaction = async () => {
    try {
      const reaction = await reactionService.getUserReaction(proposal.id);
      setUserReaction(reaction || null);
      if (reaction?.comment) {
        setComment(reaction.comment);
      }
    } catch (error) {
      // User might not have reacted yet, which is fine
      console.log('No existing reaction found');
    }
  };

  const loadReactionStats = async () => {
    try {
      const response = await reactionService.getReactionsByProposal(proposal.id);
      setReactionStats(response.stats || null);
    } catch (error) {
      console.error('Error loading reaction stats:', error);
    }
  };

  const loadConnections = async () => {
    if (!currentUserId) return;
    
    setLoadingConnections(true);
    try {
      const response = await proposalService.getProposalConnections(proposal.id, currentUserId);
      setConnections(response.connections);
    } catch (error) {
      console.error('Error loading proposal connections:', error);
      // Don't show error to user for connections, just fail silently
    } finally {
      setLoadingConnections(false);
    }
  };

  const handleReaction = async (response: 'like' | 'dislike') => {
    setIsSubmitting(true);
    setError(null);

    try {
      const reactionResponse = await reactionService.createOrUpdateReaction(
        proposal.id, 
        response, 
        comment.trim() || undefined
      );
      
      setUserReaction(reactionResponse);
      setShowCommentForm(false);
      
      // Reload stats to show updated counts
      await loadReactionStats();
    } catch (error) {
      console.error('Error submitting reaction:', error);
      setError('Failed to submit reaction. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteReaction = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      await reactionService.deleteReaction(proposal.id);
      setUserReaction(null);
      setComment('');
      setShowCommentForm(false);
      
      // Reload stats to show updated counts
      await loadReactionStats();
    } catch (error) {
      console.error('Error deleting reaction:', error);
      setError('Failed to delete reaction. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

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

      {/* Reaction Stats */}
      {reactionStats && reactionStats.totalReactions > 0 && (
        <div className="reaction-stats">
          <span className="stats-item">
            👍 {reactionStats.likes} ({reactionStats.likePercentage}%)
          </span>
          <span className="stats-item">
            👎 {reactionStats.dislikes}
          </span>
          <span className="stats-total">
            {reactionStats.totalReactions} reaction{reactionStats.totalReactions !== 1 ? 's' : ''}
          </span>
        </div>
      )}

      {/* User's Current Reaction */}
      {userReaction && (
        <div className="current-reaction">
          <div className="reaction-display">
            <span className="reaction-icon">
              {userReaction.response === 'like' ? '👍' : '👎'}
            </span>
            <span className="reaction-text">
              You {userReaction.response}d this proposal
            </span>
            <button 
              onClick={handleDeleteReaction}
              className="btn btn-sm btn-outline"
              disabled={isSubmitting}
            >
              Remove
            </button>
          </div>
          {userReaction.comment && (
            <div className="reaction-comment">
              <strong>Your comment:</strong> {userReaction.comment}
            </div>
          )}
        </div>
      )}

      {/* Reaction Buttons */}
      {!userReaction && (
        <div className="reaction-buttons">
          <button 
            onClick={() => handleReaction('like')}
            className="btn btn-sm btn-success"
            disabled={isSubmitting}
          >
            👍 Like
          </button>
          <button 
            onClick={() => handleReaction('dislike')}
            className="btn btn-sm btn-danger"
            disabled={isSubmitting}
          >
            👎 Dislike
          </button>
          <button 
            onClick={() => setShowCommentForm(!showCommentForm)}
            className="btn btn-sm btn-outline"
          >
            💬 Add Comment
          </button>
        </div>
      )}

      {/* Comment Form */}
      {showCommentForm && (
        <div className="comment-form">
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your thoughts on this proposal..."
            className="comment-input"
            rows={3}
          />
          <div className="comment-actions">
            <button 
              onClick={() => handleReaction('like')}
              className="btn btn-sm btn-success"
              disabled={isSubmitting || !comment.trim()}
            >
              👍 Like with Comment
            </button>
            <button 
              onClick={() => handleReaction('dislike')}
              className="btn btn-sm btn-danger"
              disabled={isSubmitting || !comment.trim()}
            >
              👎 Dislike with Comment
            </button>
            <button 
              onClick={() => {
                setShowCommentForm(false);
                setComment(userReaction?.comment || '');
              }}
              className="btn btn-sm btn-outline"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Outcome-Proposal Connections */}
      {showConnections && connections && (
        <div className="proposal-connections">
          <div className="connections-header">
            <h4>How This Helps Your Outcomes</h4>
            {connections.overallRelevanceScore > 0 && (
              <div className="relevance-score">
                <span className="score-label">Relevance:</span>
                <div className="score-bar">
                  <div 
                    className="score-fill" 
                    style={{ width: `${connections.overallRelevanceScore * 100}%` }}
                  ></div>
                </div>
                <span className="score-text">
                  {Math.round(connections.overallRelevanceScore * 100)}%
                </span>
              </div>
            )}
          </div>

          <div className="benefit-explanation">
            <p>{connections.benefitExplanation}</p>
          </div>

          {connections.sharedThemes.length > 0 && (
            <div className="shared-themes">
              <strong>Key themes:</strong>
              <div className="theme-tags">
                {connections.sharedThemes.map((theme, index) => (
                  <span key={index} className="theme-tag">{theme}</span>
                ))}
              </div>
            </div>
          )}

          {connections.userOutcomes.length > 0 && (
            <div className="outcome-connections">
              <button 
                onClick={() => setShowConnectionDetails(!showConnectionDetails)}
                className="btn btn-sm btn-outline connections-toggle"
              >
                {showConnectionDetails ? 'Hide' : 'Show'} Detailed Connections ({connections.userOutcomes.length})
              </button>

              {showConnectionDetails && (
                <div className="connection-details">
                  {connections.userOutcomes
                    .filter(outcome => outcome.connectionStrength > 0.1)
                    .sort((a, b) => b.connectionStrength - a.connectionStrength)
                    .map((outcome) => (
                      <div key={outcome.outcomeId} className="outcome-connection">
                        <div className="outcome-header">
                          <div className="outcome-statement">
                            <strong>Your outcome:</strong> "{outcome.statement}"
                          </div>
                          <div className="connection-strength">
                            <span className="strength-label">Connection:</span>
                            <div className="strength-bar">
                              <div 
                                className="strength-fill" 
                                style={{ width: `${outcome.connectionStrength * 100}%` }}
                              ></div>
                            </div>
                            <span className="strength-text">
                              {Math.round(outcome.connectionStrength * 100)}%
                            </span>
                          </div>
                        </div>
                        <div className="how-it-helps">
                          <strong>How this proposal helps:</strong>
                          <p>{outcome.howProposalHelps}</p>
                        </div>
                        {outcome.sharedThemes.length > 0 && (
                          <div className="outcome-themes">
                            <strong>Shared themes:</strong>
                            <div className="theme-tags">
                              {outcome.sharedThemes.map((theme, themeIndex) => (
                                <span key={themeIndex} className="theme-tag small">{theme}</span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Loading Connections */}
      {showConnections && loadingConnections && (
        <div className="loading-connections">
          <span>Analyzing how this proposal connects to your outcomes...</span>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
      
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