import React, { useState, useEffect, useRef } from 'react';
import { conversationService } from '../services/api';
import { ChatMessage } from '../types';

interface ChatProps {
  user: any;
}

const Chat: React.FC<ChatProps> = ({ user: _user }) => {
  const [conversations, setConversations] = useState<any[]>([]);
  const [currentConversation, setCurrentConversation] = useState<any | null>(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentConversation?.messages]);

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      const response = await conversationService.getConversations();
      if (response.conversations) {
        setConversations(response.conversations);
        
        // Select the most recent conversation if available
        if (response.conversations.length > 0) {
          setCurrentConversation(response.conversations[0]);
        }
      }
    } catch (err: any) {
      setError('Failed to load conversations');
    }
  };

  const startNewConversation = async () => {
    if (!message.trim()) return;

    setLoading(true);
    setError('');

    try {
      const response = await conversationService.createConversation(message.trim());
      setCurrentConversation(response.conversation);
      setConversations([response.conversation, ...conversations]);
      setMessage('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to start conversation');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!message.trim() || !currentConversation) return;

    setLoading(true);
    setError('');

    try {
      const response = await conversationService.addMessage(currentConversation.id, message.trim());
      setCurrentConversation(response.conversation);
      
      // Update the conversation in the list
      setConversations(conversations.map(conv => 
        conv.id === response.conversation.id ? response.conversation : conv
      ));
      
      setMessage('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentConversation) {
      sendMessage();
    } else {
      startNewConversation();
    }
  };

  const selectConversation = (conversation: any) => {
    setCurrentConversation(conversation);
    setError('');
  };

  const formatMessageTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="chat-container">
      <div className="chat-sidebar">
        <h3>Conversations</h3>
        <button 
          className="new-conversation-btn"
          onClick={() => setCurrentConversation(null)}
        >
          + New Conversation
        </button>
        
        <div className="conversation-list">
          {conversations.map((conv) => (
            <div
              key={conv.id}
              className={`conversation-item ${currentConversation?.id === conv.id ? 'active' : ''}`}
              onClick={() => selectConversation(conv)}
            >
              <div className="conversation-preview">
                {conv.messages[0]?.content.substring(0, 50)}...
              </div>
              <div className="conversation-time">
                {formatMessageTime(conv.createdAt)}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="chat-main">
        <div className="chat-header">
          <h2>
            {currentConversation ? 'Chat with Home Mind' : 'Start a New Conversation'}
          </h2>
          <p className="chat-subtitle">
            Tell me about what you want to see in the world
          </p>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="messages-container">
          {currentConversation ? (
            <>
              {currentConversation.messages.map((msg: ChatMessage, index: number) => (
                <div key={index} className={`message ${msg.role}`}>
                  <div className="message-content">
                    {msg.content}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </>
          ) : (
            <div className="welcome-message">
              <h3>Welcome to your Home Mind!</h3>
              <p>
                I'm here to learn about your desired outcomes for the world. 
                Share what you want to see happen, and I'll help you articulate 
                your vision for a better future.
              </p>
              <p>
                Start by telling me about something you care about or 
                a change you'd like to see in the world.
              </p>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="message-form">
          <div className="message-input-container">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={
                currentConversation 
                  ? "Continue the conversation..." 
                  : "Tell me about what you want to see in the world..."
              }
              disabled={loading}
              rows={3}
              maxLength={2000}
            />
            <button type="submit" disabled={loading || !message.trim()}>
              {loading ? 'Sending...' : 'Send'}
            </button>
          </div>
          <div className="character-count">
            {message.length}/2000
          </div>
        </form>
      </div>
    </div>
  );
};

export default Chat;