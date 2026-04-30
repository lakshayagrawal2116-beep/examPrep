export default function LoadingIndicator() {
  return (
    <div className="message ai">
      <div className="message-avatar">🤖</div>
      <div className="message-content">
        <div className="message-bubble">
          <div className="typing-indicator">
            <div className="typing-dot"></div>
            <div className="typing-dot"></div>
            <div className="typing-dot"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
