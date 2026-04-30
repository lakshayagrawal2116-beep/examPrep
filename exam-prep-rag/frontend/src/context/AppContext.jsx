import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  listDocuments,
  listSessions, createSession as apiCreateSession,
  getSession as apiGetSession, deleteSession as apiDeleteSession,
  addMessage as apiAddMessage,
} from '../utils/api';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [documents, setDocuments] = useState([]);
  const [selectedDocIds, setSelectedDocIds] = useState([]);
  const [chatSessions, setChatSessions] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [activeMessages, setActiveMessages] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  // Load documents and sessions on mount, auto-select last active chat
  useEffect(() => {
    refreshDocuments();
    refreshSessions().then(sessions => {
      if (sessions && sessions.length > 0 && !activeChatId) {
        setActiveChatId(sessions[0].id);
      }
    });
  }, []);

  // Load messages when active chat changes
  useEffect(() => {
    if (activeChatId) {
      loadSessionMessages(activeChatId);
    } else {
      setActiveMessages([]);
    }
  }, [activeChatId]);

  async function refreshDocuments() {
    try {
      const data = await listDocuments();
      setDocuments(data.documents || []);
    } catch (err) {
      console.error('Failed to load documents:', err);
    }
  }

  async function refreshSessions() {
    try {
      const data = await listSessions();
      const sessions = data.sessions || [];
      setChatSessions(sessions);
      return sessions;
    } catch (err) {
      console.error('Failed to load sessions:', err);
      return [];
    }
  }

  async function loadSessionMessages(sessionId) {
    try {
      const data = await apiGetSession(sessionId);
      setActiveMessages(data.messages || []);
    } catch (err) {
      console.error('Failed to load session:', err);
      setActiveMessages([]);
    }
  }

  function getActiveChat() {
    return chatSessions.find(s => s.id === activeChatId) || null;
  }

  async function createNewChat() {
    try {
      const session = await apiCreateSession('New Chat');
      setChatSessions(prev => [{ id: session.id, title: session.title, created_at: session.created_at, message_count: 0 }, ...prev]);
      setActiveChatId(session.id);
      setActiveMessages([]);
      return session.id;
    } catch (err) {
      console.error('Failed to create chat:', err);
      return null;
    }
  }

  const saveMessage = useCallback(async (sessionId, role, content, sources = null) => {
    try {
      await apiAddMessage(sessionId, role, content, sources);
      // Refresh session list to update titles
      refreshSessions();
    } catch (err) {
      console.error('Failed to save message:', err);
    }
  }, []);

  // Update local messages optimistically (for streaming)
  function updateActiveMessages(messages) {
    setActiveMessages(messages);
  }

  async function deleteChat(chatId) {
    try {
      await apiDeleteSession(chatId);
      setChatSessions(prev => prev.filter(s => s.id !== chatId));
      if (activeChatId === chatId) {
        setActiveChatId(null);
        setActiveMessages([]);
      }
    } catch (err) {
      console.error('Failed to delete chat:', err);
    }
  }

  const [activeView, setActiveView] = useState('chat'); // 'chat' or 'quiz'

  const value = {
    documents, setDocuments, refreshDocuments,
    selectedDocIds, setSelectedDocIds,
    chatSessions, activeChatId, setActiveChatId,
    activeMessages, updateActiveMessages, saveMessage,
    getActiveChat, createNewChat, deleteChat,
    sidebarOpen, setSidebarOpen,
    uploadModalOpen, setUploadModalOpen,
    activeView, setActiveView,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
