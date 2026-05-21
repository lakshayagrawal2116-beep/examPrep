import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';

export default function Sidebar() {
  const {
    chatSessions, activeChatId, setActiveChatId,
    createNewChat, deleteChat, documents,
    sidebarOpen, setSidebarOpen, setUploadModalOpen,
    activeView, setActiveView,
  } = useApp();
  const { user, logout } = useAuth();

  return (
    <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
      <div className="sidebar-brand">
        <h1>ExamPrep AI</h1>
        <p>Your AI Study Companion</p>
      </div>

      <div className="sidebar-mode-toggle">
        <button 
          className={`mode-btn ${activeView === 'chat' ? 'active' : ''}`}
          onClick={() => setActiveView('chat')}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          Chat
        </button>
        <button 
          className={`mode-btn ${activeView === 'quiz' ? 'active' : ''}`}
          onClick={() => setActiveView('quiz')}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
          Quiz
        </button>
      </div>

      <div className="sidebar-actions">
        {activeView === 'chat' && (
          <button
            className="btn btn-primary"
            style={{ width: '100%' }}
            onClick={() => { createNewChat(); setSidebarOpen(false); }}
          >
            + New Chat
          </button>
        )}
        <button
          className="btn btn-ghost"
          style={{ width: '100%' }}
          onClick={() => setUploadModalOpen(true)}
        >
          Upload Document
        </button>
      </div>

      <div className="sidebar-section-title">Chat History</div>

      <div className="sidebar-chats">
        {chatSessions.length === 0 && (
          <p style={{ padding: '12px 16px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            No conversations yet
          </p>
        )}
        {chatSessions.map(session => (
          <div
            key={session.id}
            className={`chat-history-item ${session.id === activeChatId ? 'active' : ''}`}
            onClick={() => { setActiveChatId(session.id); setSidebarOpen(false); }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0, opacity: 0.5 }}>
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>
              {session.title}
            </span>
            <button
              className="btn-icon"
              style={{ width: '24px', height: '24px', fontSize: '0.7rem', flexShrink: 0, border: 'none', background: 'none' }}
              onClick={(e) => { e.stopPropagation(); deleteChat(session.id); }}
              title="Delete chat"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      <div className="sidebar-footer">
        <div className="sidebar-doc-count">
          {documents.length} document{documents.length !== 1 ? 's' : ''} indexed
        </div>
        {user && (
          <div className="sidebar-user">
            <div className="sidebar-user-avatar">
              {user.name ? user.name[0].toUpperCase() : '?'}
            </div>
            <div className="sidebar-user-info">
              <span className="sidebar-user-name">{user.name}</span>
              <span className="sidebar-user-email">{user.email}</span>
            </div>
            <button className="sidebar-logout" onClick={logout} title="Sign out">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
