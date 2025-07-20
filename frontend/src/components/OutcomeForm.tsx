import React, { useState } from 'react';
import { outcomeService } from '../services/api';
import { Outcome } from '../types';

interface OutcomeFormProps {
  onOutcomeCreated: (outcome: Outcome) => void;
  onCancel?: () => void;
}

const OutcomeForm: React.FC<OutcomeFormProps> = ({ onOutcomeCreated, onCancel }) => {
  const [statement, setStatement] = useState('');
  const [importance, setImportance] = useState(3);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!statement.trim()) {
      setError('Please enter an outcome statement');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await outcomeService.createOutcome(statement.trim(), importance);
      if (response.outcome) {
        onOutcomeCreated(response.outcome);
        setStatement('');
        setImportance(3);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create outcome');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatStatementForDisplay = (text: string) => {
    if (!text.trim()) return '';
    
    // If it doesn't start with "I want a world where", add it
    if (!text.toLowerCase().startsWith('i want a world where')) {
      return `I want a world where ${text.toLowerCase()}`;
    }
    return text;
  };

  return (
    <div className="outcome-form">
      <h3>Add New Outcome</h3>
      <p className="form-description">
        Express what you want to see in the world. Focus on desired outcomes rather than specific policies or positions.
      </p>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="statement">Outcome Statement</label>
          <textarea
            id="statement"
            value={statement}
            onChange={(e) => setStatement(e.target.value)}
            placeholder="e.g., everyone has access to quality education, communities are more connected, people feel safe in their neighborhoods..."
            rows={3}
            disabled={isSubmitting}
            className="form-control"
          />
          {statement.trim() && (
            <div className="statement-preview">
              <strong>Preview:</strong> {formatStatementForDisplay(statement)}
            </div>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="importance">Importance Level</label>
          <div className="importance-selector">
            <input
              type="range"
              id="importance"
              min="1"
              max="5"
              value={importance}
              onChange={(e) => setImportance(parseInt(e.target.value))}
              disabled={isSubmitting}
              className="importance-slider"
            />
            <div className="importance-labels">
              <span className={importance === 1 ? 'active' : ''}>1 - Low</span>
              <span className={importance === 2 ? 'active' : ''}>2</span>
              <span className={importance === 3 ? 'active' : ''}>3 - Medium</span>
              <span className={importance === 4 ? 'active' : ''}>4</span>
              <span className={importance === 5 ? 'active' : ''}>5 - High</span>
            </div>
          </div>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <div className="form-actions">
          <button
            type="submit"
            disabled={isSubmitting || !statement.trim()}
            className="btn btn-primary"
          >
            {isSubmitting ? 'Creating...' : 'Add Outcome'}
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="btn btn-secondary"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default OutcomeForm;