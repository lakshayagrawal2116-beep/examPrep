import { useState, useCallback, useRef } from 'react';
import { useApp } from '../context/AppContext';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export function useChat() {
  const {
    activeChatId, createNewChat,
    activeMessages, updateActiveMessages, saveMessage,
    selectedDocIds,
  } = useApp();
  const [isStreaming, setIsStreaming] = useState(false);
  const abortRef = useRef(null);

  const messages = activeMessages;

  const sendMessage = useCallback(async (question) => {
    let chatId = activeChatId;
    if (!chatId) {
      chatId = await createNewChat();
      if (!chatId) return;
    }

    const userMsg = { role: 'user', content: question, timestamp: Date.now() };
    const aiMsg = { role: 'ai', content: '', sources: [], timestamp: Date.now() + 1 };

    const currentMessages = [...messages];
    const updatedMessages = [...currentMessages, userMsg, aiMsg];
    updateActiveMessages(updatedMessages);
    setIsStreaming(true);

    const chatHistory = currentMessages.slice(-6).map(m => ({
      role: m.role === 'ai' ? 'assistant' : 'user',
      content: m.content,
    }));

    const token = localStorage.getItem('ep_token');
    const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

    try {
      const controller = new AbortController();
      abortRef.current = controller;

      const res = await fetch(`${API_BASE}/api/chat/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({
          question,
          doc_ids: selectedDocIds,
          chat_history: chatHistory,
        }),
        signal: controller.signal,
      });

      if (!res.ok) throw new Error('Chat request failed');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let fullContent = '';
      let sources = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('event:')) continue;

          if (line.startsWith('data:')) {
            const dataStr = line.slice(5).trim();
            if (!dataStr) continue;

            try {
              const data = JSON.parse(dataStr);

              if (data.content !== undefined && !data.sources) {
                fullContent += data.content;
                const newMessages = [...updatedMessages.slice(0, -1), {
                  ...aiMsg,
                  content: fullContent,
                  sources,
                }];
                updateActiveMessages(newMessages);
              }

              if (data.sources) {
                sources = data.sources;
                const newMessages = [...updatedMessages.slice(0, -1), {
                  ...aiMsg,
                  content: fullContent,
                  sources,
                }];
                updateActiveMessages(newMessages);
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }

      // Final update
      const finalMessages = [...updatedMessages.slice(0, -1), {
        ...aiMsg,
        content: fullContent,
        sources,
      }];
      updateActiveMessages(finalMessages);

      // Persist both messages to database
      await saveMessage(chatId, 'user', question);
      await saveMessage(chatId, 'ai', fullContent, sources.length > 0 ? sources : null);

    } catch (err) {
      if (err.name !== 'AbortError') {
        const errorMessages = [...updatedMessages.slice(0, -1), {
          ...aiMsg,
          content: `Error: ${err.message}. Make sure the backend server is running.`,
          sources: [],
        }];
        updateActiveMessages(errorMessages);
      }
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }
  }, [activeChatId, createNewChat, messages, updateActiveMessages, saveMessage, selectedDocIds]);

  const stopStreaming = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
    }
  }, []);

  return { messages, isStreaming, sendMessage, stopStreaming };
}
