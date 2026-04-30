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

    let fullContent = '';
    let sources = [];

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

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith('event:') || trimmed.startsWith(':')) continue;

          if (trimmed.startsWith('data:')) {
            const dataStr = trimmed.slice(5).trim();
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

    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('[Chat] Streaming error:', err);
        const errorContent = `Error: ${err.message}. Make sure the backend server is running.`;
        const errorMessages = [...updatedMessages.slice(0, -1), {
          ...aiMsg,
          content: fullContent || errorContent,
          sources: [],
        }];
        updateActiveMessages(errorMessages);
      }
    } finally {
      setIsStreaming(false);
      abortRef.current = null;

      // Always persist messages to database (even after errors)
      console.log('[Chat] Saving messages. chatId:', chatId, 'fullContent length:', fullContent.length, 'fullContent preview:', fullContent.slice(0, 100));

      try {
        console.log('[Chat] Saving user message...');
        await saveMessage(chatId, 'user', question);
        console.log('[Chat] User message saved ✓');

        if (fullContent) {
          console.log('[Chat] Saving AI message...');
          await saveMessage(chatId, 'ai', fullContent, sources.length > 0 ? sources : null);
          console.log('[Chat] AI message saved ✓');
        } else {
          console.warn('[Chat] fullContent is EMPTY — skipping AI message save!');
        }
      } catch (saveErr) {
        console.error('[Chat] Failed to persist messages:', saveErr);
      }
    }
  }, [activeChatId, createNewChat, messages, updateActiveMessages, saveMessage, selectedDocIds]);

  const stopStreaming = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
    }
  }, []);

  return { messages, isStreaming, sendMessage, stopStreaming };
}

