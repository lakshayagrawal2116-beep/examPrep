import { useState, useRef, useEffect } from 'react';
import { useChat } from '../hooks/useChat';
import { useApp } from '../context/AppContext';
import MessageBubble from './MessageBubble';
import LoadingIndicator from './LoadingIndicator';

export default function ChatWindow() {
  const { messages, isStreaming, sendMessage, stopStreaming } = useChat();
  const { documents, setUploadModalOpen, activeChatId } = useApp();
  const [input, setInput] = useState('');
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [input]);

  const handleSend = async () => {
    const q = input.trim();
    if (!q || isStreaming) return;
    setInput('');
    setError(null);
    try {
      await sendMessage(q);
    } catch (err) {
      setError('Failed to send message. Please check your connection and try again.');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const suggestions = [
    "Explain the key concepts from my notes",
    "Summarize the main topics",
    "What are the important formulas?",
    "Create a brief overview of this subject",
  ];

  const showWelcome = !activeChatId || messages.length === 0;

  return (
    <div className="chat-container">
      <div className="chat-messages">
        {showWelcome ? (
          <div className="chat-welcome">
            <div className="chat-welcome-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                <path d="M6 12v5c3 3 9 3 12 0v-5" />
              </svg>
            </div>
            <h2>Ready to Study Smarter</h2>
            <p>
              Upload your PDF study materials and ask me anything about them.
              I'll answer based exclusively on your notes with source citations.
            </p>

            {documents.length === 0 ? (
              <button
                className="btn btn-primary"
                style={{ marginTop: '8px' }}
                onClick={() => setUploadModalOpen(true)}
              >
                Upload Your First PDF
              </button>
            ) : (
              <div className="suggestion-chips">
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    className="suggestion-chip"
                    onClick={() => { setInput(s); }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <>
            {messages.map((msg, i) => (
              <MessageBubble key={msg.id || `msg-${i}-${msg.timestamp}`} message={msg} />
            ))}
            {isStreaming && messages[messages.length - 1]?.content === '' && (
              <LoadingIndicator />
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-area">
        {error && (
          <div className="chat-error-bar">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{error}</span>
            <button onClick={() => setError(null)}>✕</button>
          </div>
        )}
        <div className="chat-input-wrapper">
          <textarea
            ref={textareaRef}
            className="chat-input"
            placeholder={
              documents.length === 0
                ? "Upload a PDF first to start asking questions..."
                : "Ask a question about your study materials..."
            }
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            disabled={documents.length === 0}
          />
          {isStreaming ? (
            <button className="send-btn" onClick={stopStreaming} title="Stop">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="6" width="12" height="12" rx="2" />
              </svg>
            </button>
          ) : (
            <button
              className="send-btn"
              onClick={handleSend}
              disabled={!input.trim() || documents.length === 0}
              title="Send"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          )}
        </div>
        <div className="chat-input-hint">
          ExamPrep AI answers only from your uploaded documents. Press Enter to send, Shift+Enter for new line.
        </div>
      </div>
    </div>
  );
}
