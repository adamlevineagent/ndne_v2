import React, { useState, useEffect } from 'react';
import { outcomeService } from '../services/api';
import { Outcome } from '../types';

interface OutcomeListProps {
  userId: string;
  outcomes: Outcome[];
  onOutcomesChange: (outcomes: Outcome[]) => void;
}

const OutcomeList: React.FC<OutcomeListProps> = ({ userId, outcomes, onOutcomesChange }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editStatement, setEditStatement] = useState('');
  const [editImportance, setEditImportance] = useState(3);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEdit = (outcome: Outcome) => {
    setEditingId(outcome.id);
    setEditStatement(outcome.statement);
    setEditImportance(outcome.importance);
    setError(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditStatement('');
    setEditImportance(3);
    setError(null);
  };

  const handleSaveEdit = async (outcomeId: string) => {
    if (!editStatement.trim()) {
      setError('Statement cannot be empty');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await outcomeService.updateOutcome(outcomeId, {
        statement: editStatement.trim(),
        importance: editImportance
      });

      if (response.outcome) {
        const updatedOutcomes = outcomes.map(outcome =>
          outcome.id === outcomeId ? response.outcome : outcome
        );
        onOutcomesChange(updatedOutcomes);
        setEditingId(null);
        setEditStatement('');
        setEditImportance(3);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update outcome');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (outcomeId: string) => {
    if (!window.confirm('Are you sure you want to delete this outcome?')) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await outcomeService.deleteOutcome(outcomeId);
      const updatedOutcomes = outcomes.filter(outcome => outcome.id !== outcomeId);
      onOutcomesChange(updatedOutcomes);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete outcome');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefine = async (outcomeId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await outcomeService.refineOutcome(outcomeId);
      if (response.outcome) {
        const updatedOutcomes = outcomes.map(outcome =>
          outcome.id === outcomeId ? response.outcome : outcome
        );
        onOutcomesChange(updatedOutcomes);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to refine outcome');
    } finally {
      setIsLoading(false);
    }
  };

  const getImportanceLabel = (importance: number) => {
    const labels = {
      1: 'Low',
      2: 'Low-Medium',
      3: 'Medium',
      4: 'Medium-High',
      5: 'High'
    };
    return labels[importance as keyof typeof labels] || 'Medium';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (outcomes.length === 0) {
    return (
      <div className="outcome-list empty">
        <p>No outcomes yet. Start by adding what you want to see in the world!</p>
      </div>
    );
  }

  return (
    <div className="outcome-list">
      <h3>Your Outcomes ({outcomes.length})</h3>
      
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="outcomes">
        {outcomes.map((outcome) => (
          <div key={outcome.id} className="outcome-card">
            {editingId === outcome.id ? (
              <div className="outcome-edit">
                <textarea
                  value={editStatement}
                  onChange={(e) => setEditStatement(e.target.value)}
                  rows={3}
                  className="form-control"
                  disabled={isLoading}
                />
                <div className="importance-edit">
                  <label>Importance:</label>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={editImportance}
                    onChange={(e) => setEditImportance(parseInt(e.target.value))}
                    disabled={isLoading}
                  />
                  <span>{getImportanceLabel(editImportance)}</span>
                </div>
                <div className="edit-actions">
                  <button
                    onClick={() => handleSaveEdit(outcome.id)}
                    disabled={isLoading || !editStatement.trim()}
                    className="btn btn-primary btn-sm"
                  >
                    {isLoading ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    disabled={isLoading}
                    className="btn btn-secondary btn-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="outcome-display">
                <div className="outcome-header">
                  <div className="outcome-meta">
                    <span className={`importance-badge importance-${outcome.importance}`}>
                      {getImportanceLabel(outcome.importance)}
                    </span>
                    {outcome.extractedFromConversation && (
                      <span className="extracted-badge">From Conversation</span>
                    )}
                    <span className="date">{formatDate(outcome.createdAt.toString())}</span>
                  </div>
                </div>
                
                <div className="outcome-statement">
                  {outcome.statement}
                </div>

                {outcome.refinementHistory.length > 0 && (
                  <div className="refinement-history">
                    <details>
                      <summary>Refinement History ({outcome.refinementHistory.length})</summary>
                      {outcome.refinementHistory.map((entry, index) => (
                        <div key={index} className="refinement-entry">
                          <div className="refinement-date">
                            {formatDate(entry.timestamp.toString())}
                          </div>
                          <div className="refinement-change">
                            <strong>From:</strong> {entry.originalStatement}
                            <br />
                            <strong>To:</strong> {entry.refinedStatement}
                            <br />
                            <em>{entry.reason}</em>
                          </div>
                        </div>
                      ))}
                    </details>
                  </div>
                )}

                <div className="outcome-actions">
                  <button
                    onClick={() => handleEdit(outcome)}
                    disabled={isLoading}
                    className="btn btn-outline btn-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleRefine(outcome.id)}
                    disabled={isLoading}
                    className="btn btn-outline btn-sm"
                  >
                    {isLoading ? 'Refining...' : 'AI Refine'}
                  </button>
                  <button
                    onClick={() => handleDelete(outcome.id)}
                    disabled={isLoading}
                    className="btn btn-danger btn-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default OutcomeList;