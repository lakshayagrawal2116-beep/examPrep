const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/** Get auth token from localStorage */
function getAuthHeaders() {
  const token = localStorage.getItem('ep_token');
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

/** Normalize FastAPI error detail (string or validation array). */
function parseErrorDetail(detail, fallback = 'Request failed') {
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    return detail.map((d) => d.msg || d.message || JSON.stringify(d)).join('. ');
  }
  return fallback;
}

/** Handle 401 — auto logout */
function handleUnauthorized(res) {
  if (res.status === 401 || res.status === 403) {
    localStorage.removeItem('ep_token');
    window.location.reload();
  }
}

export async function uploadDocument(file) {
  const token = localStorage.getItem('ep_token');
  if (!token) {
    throw new Error('You must be signed in to upload documents.');
  }

  const formData = new FormData();
  formData.append('file', file);

  let res;
  try {
    res = await fetch(`${API_BASE}/api/documents/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
  } catch {
    throw new Error(
      `Cannot reach the server at ${API_BASE}. Make sure the backend is running.`
    );
  }

  handleUnauthorized(res);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Upload failed' }));
    throw new Error(parseErrorDetail(err.detail, 'Upload failed'));
  }

  return res.json();
}

export async function listDocuments() {
  const res = await fetch(`${API_BASE}/api/documents/`, {
    headers: { ...getAuthHeaders() },
  });
  handleUnauthorized(res);
  if (!res.ok) throw new Error('Failed to fetch documents');
  return res.json();
}

export async function deleteDocument(docId) {
  const res = await fetch(`${API_BASE}/api/documents/${docId}`, {
    method: 'DELETE',
    headers: { ...getAuthHeaders() },
  });
  handleUnauthorized(res);
  if (!res.ok) throw new Error('Failed to delete document');
  return res.json();
}

export function streamChat(question, docIds = [], chatHistory = []) {
  return {
    url: `${API_BASE}/api/chat/query`,
    headers: { ...getAuthHeaders() },
    body: JSON.stringify({
      question,
      doc_ids: docIds,
      chat_history: chatHistory,
    }),
  };
}

// ---------- Session API ----------

export async function listSessions() {
  const res = await fetch(`${API_BASE}/api/sessions/`, {
    headers: { ...getAuthHeaders() },
  });
  handleUnauthorized(res);
  if (!res.ok) throw new Error('Failed to fetch sessions');
  return res.json();
}

export async function createSession(title = 'New Chat') {
  const res = await fetch(`${API_BASE}/api/sessions/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify({ title }),
  });
  handleUnauthorized(res);
  if (!res.ok) throw new Error('Failed to create session');
  return res.json();
}

export async function getSession(sessionId) {
  const res = await fetch(`${API_BASE}/api/sessions/${sessionId}`, {
    headers: { ...getAuthHeaders() },
  });
  handleUnauthorized(res);
  if (!res.ok) throw new Error('Failed to fetch session');
  return res.json();
}

export async function deleteSession(sessionId) {
  const res = await fetch(`${API_BASE}/api/sessions/${sessionId}`, {
    method: 'DELETE',
    headers: { ...getAuthHeaders() },
  });
  handleUnauthorized(res);
  // 404 is fine — session already deleted
  if (!res.ok && res.status !== 404) throw new Error('Failed to delete session');
  return res.json().catch(() => ({ message: 'Deleted' }));
}

export async function addMessage(sessionId, role, content, sourcesJson = null) {
  const res = await fetch(`${API_BASE}/api/sessions/${sessionId}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify({ role, content, sources_json: sourcesJson }),
  });
  handleUnauthorized(res);
  if (!res.ok) throw new Error('Failed to save message');
  return res.json();
}

// ---------- Quiz API ----------

async function parseQuizError(res, fallback) {
  const err = await res.json().catch(() => ({}));
  throw new Error(parseErrorDetail(err.detail, fallback));
}

export async function checkQuizAnswer(quizId, questionId, userAnswer) {
  const res = await fetch(
    `${API_BASE}/api/quiz/${quizId}/questions/${questionId}/check`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ user_answer: userAnswer }),
    }
  );
  handleUnauthorized(res);
  if (!res.ok) await parseQuizError(res, 'Failed to check answer');
  return res.json();
}

export async function submitQuiz(quizId, answers) {
  const res = await fetch(`${API_BASE}/api/quiz/${quizId}/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify({ answers }),
  });
  handleUnauthorized(res);
  if (!res.ok) await parseQuizError(res, 'Failed to submit quiz');
  return res.json();
}

export async function getQuizHistory() {
  const res = await fetch(`${API_BASE}/api/quiz/history`, {
    headers: { ...getAuthHeaders() },
  });
  handleUnauthorized(res);
  if (!res.ok) throw new Error('Failed to load quiz history');
  return res.json();
}

export async function getQuizDetail(quizId) {
  const res = await fetch(`${API_BASE}/api/quiz/${quizId}`, {
    headers: { ...getAuthHeaders() },
  });
  handleUnauthorized(res);
  if (!res.ok) await parseQuizError(res, 'Failed to load quiz');
  return res.json();
}
