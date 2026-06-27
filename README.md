# 📚 ExamPrep RAG — AI-Powered Study Companion

An intelligent exam preparation platform that uses **Retrieval-Augmented Generation (RAG)** to let students upload PDF study materials and interact with them through an AI chat assistant and auto-generated quizzes.

> **Live Demo:** https://examprep-frontend-zano.onrender.com/

---

## ✨ Features

| Feature | Description |
|---|---|
| **PDF Upload & Processing** | Upload PDF study materials; text is extracted, chunked, and embedded into a vector database |
| **RAG Chat Assistant** | Ask questions and get AI answers grounded *exclusively* in your uploaded documents with source citations |
| **Real-time Streaming** | Responses stream token-by-token via Server-Sent Events (SSE) for a ChatGPT-like experience |
| **AI Quiz Generation** | Auto-generate MCQ quizzes from your documents with configurable topic, difficulty, and question count |
| **Document Scoping** | Select specific documents to focus your chat or quiz on |
| **Chat History** | Full session management — create, rename, delete, and revisit past conversations |
| **User Authentication** | JWT-based signup/login with bcrypt password hashing |
| **LaTeX Math Rendering** | Mathematical formulas render beautifully using KaTeX |
| **Ephemeral FS Recovery** | ChromaDB auto-rebuilds from PostgreSQL on deploy platforms like Render |
| **Server Wake-Up Screen** | Graceful loading UX when the backend cold-starts on free-tier hosts |

---

## 🏗️ Architecture

```
exam-prep-rag/
├── backend/                    # Python FastAPI server
│   ├── app/
│   │   ├── main.py             # App entry point, lifespan, CORS, router mounting
│   │   ├── config.py           # Pydantic settings from .env
│   │   ├── database.py         # SQLAlchemy engine & session
│   │   ├── models/
│   │   │   ├── db_models.py    # ORM models (User, ChatSession, Document, Quiz, etc.)
│   │   │   └── schemas.py      # Pydantic request/response schemas
│   │   ├── routers/
│   │   │   ├── auth.py         # Signup, login, profile endpoints
│   │   │   ├── chat.py         # SSE streaming RAG chat endpoint
│   │   │   ├── documents.py    # Upload, list, delete PDFs
│   │   │   ├── history.py      # Chat session CRUD & message persistence
│   │   │   └── quiz.py         # Quiz generation, submission, history
│   │   ├── services/
│   │   │   ├── auth_service.py   # Password hashing, JWT creation/verification
│   │   │   ├── pdf_service.py    # PDF text extraction & chunking (PyMuPDF)
│   │   │   ├── rag_service.py    # LangChain RAG chain with Gemini streaming
│   │   │   ├── quiz_service.py   # Quiz generation via structured LLM output
│   │   │   └── vector_service.py # ChromaDB operations & PostgreSQL rebuild
│   │   └── utils/
│   │       ├── prompts.py        # RAG system/human prompt templates
│   │       └── quiz_prompts.py   # Quiz generation prompt templates
│   ├── requirements.txt
│   └── .env.example
│
├── frontend/                   # React (Vite) SPA
│   ├── src/
│   │   ├── App.jsx             # Root component, server check, auth gate
│   │   ├── main.jsx            # React DOM entry
│   │   ├── index.css           # Global styles
│   │   ├── components/
│   │   │   ├── AuthPage.jsx        # Login/Signup form
│   │   │   ├── LandingPage.jsx     # Marketing landing page
│   │   │   ├── Header.jsx          # Top navigation bar
│   │   │   ├── Sidebar.jsx         # Chat session list & navigation
│   │   │   ├── ChatWindow.jsx      # Chat interface with message list & input
│   │   │   ├── MessageBubble.jsx   # Individual message renderer (Markdown + LaTeX)
│   │   │   ├── LoadingIndicator.jsx# Typing indicator during streaming
│   │   │   ├── FileUpload.jsx      # PDF upload modal
│   │   │   ├── DocSelector.jsx     # Document filter selector
│   │   │   ├── DocumentPicker.jsx  # Document picker for quiz source selection
│   │   │   ├── QuizPlatform.jsx    # Quiz state machine (setup → session → results)
│   │   │   ├── QuizSetup.jsx       # Quiz configuration form
│   │   │   ├── QuizSession.jsx     # Active quiz with question navigation
│   │   │   ├── QuizResults.jsx     # Score display after submission
│   │   │   └── ServerWakeUp.jsx    # Cold-start loading screen
│   │   ├── context/
│   │   │   ├── AuthContext.jsx     # Authentication state provider
│   │   │   └── AppContext.jsx      # Global app state (documents, sessions, etc.)
│   │   ├── hooks/
│   │   │   ├── useChat.js          # SSE streaming chat logic
│   │   │   └── useDocuments.js     # Upload/delete document logic
│   │   └── utils/
│   │       └── api.js              # API client (fetch wrappers with auth)
│   ├── package.json
│   └── vite.config.js
│
└── .gitignore
```

---

## 🛠️ Tech Stack

### Backend
| Technology | Purpose |
|---|---|
| **FastAPI** | Async Python web framework |
| **LangChain** | RAG orchestration & LLM chain |
| **Google Gemini** (`gemini-2.5-flash`) | LLM for chat & quiz generation |
| **ChromaDB** | Vector database for document embeddings |
| **SQLAlchemy** | ORM for PostgreSQL/SQLite |
| **PyMuPDF (fitz)** | PDF text extraction |
| **SSE-Starlette** | Server-Sent Events streaming |
| **python-jose + bcrypt** | JWT authentication & password hashing |

### Frontend
| Technology | Purpose |
|---|---|
| **React 19** | UI framework |
| **Vite 8** | Build tool & dev server |
| **React Router DOM** | Client-side routing |
| **React Markdown** | Markdown rendering for AI responses |
| **KaTeX** | LaTeX math formula rendering |
| **remark-gfm / remark-math / rehype-katex** | Markdown plugins |

---

## 🚀 Getting Started

### Prerequisites
- **Python 3.10+**
- **Node.js 18+**
- **Google Gemini API Key** — get one at [aistudio.google.com](https://aistudio.google.com/)

### 1. Clone the Repository
```bash
git clone https://github.com/lakshayagrawal2116-beep/exam-prep-rag.git
cd exam-prep-rag
```

### 2. Backend Setup
```bash
cd backend

# Create and activate virtual environment
python -m venv venv
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env and add your GOOGLE_API_KEY (required)
```

### 3. Frontend Setup
```bash
cd frontend
npm install
```

### 4. Environment Variables

Edit `backend/.env` with your values:

```env
# Required
GOOGLE_API_KEY=your_gemini_api_key_here

# Optional (defaults shown)
GEMINI_MODEL=gemini-2.5-flash
EMBEDDING_MODEL=gemini-embedding-001
CHUNK_SIZE=1000
CHUNK_OVERLAP=200
DATABASE_URL=sqlite:///./examprep.db
JWT_SECRET_KEY=change-me-in-production-please
JWT_EXPIRY_HOURS=168
CORS_ORIGINS=http://localhost:5173
```

For the frontend, create `frontend/.env`:
```env
VITE_API_URL=http://localhost:8000
```

### 5. Run the Application

**Backend** (from `backend/` directory):
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Frontend** (from `frontend/` directory):
```bash
npm run dev
```

Open **http://localhost:5173** in your browser.

---

## 📡 API Reference

All endpoints (except auth) require a `Bearer` token in the `Authorization` header.

### Authentication
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/signup` | Create account (`email`, `password`, `name`) |
| `POST` | `/api/auth/login` | Login (`email`, `password`) → returns JWT |
| `GET` | `/api/auth/me` | Get current user profile |

### Documents
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/documents/upload` | Upload a PDF (multipart form) |
| `GET` | `/api/documents/` | List user's documents |
| `DELETE` | `/api/documents/{doc_id}` | Delete a document and its vectors |

### Chat
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/chat/query` | Send a question → SSE streaming response |

**SSE Events:** `token` (answer chunks) → `sources` (citations) → `done`

### Chat Sessions
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/sessions/` | List all chat sessions |
| `POST` | `/api/sessions/` | Create a new session |
| `GET` | `/api/sessions/{id}` | Get session with messages |
| `DELETE` | `/api/sessions/{id}` | Delete a session |
| `PATCH` | `/api/sessions/{id}` | Rename a session |
| `POST` | `/api/sessions/{id}/messages` | Save a message to a session |

### Quiz
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/quiz/generate` | Generate MCQ quiz (`topic`, `difficulty`, `num_questions`, `doc_ids`) |
| `POST` | `/api/quiz/{quiz_id}/submit` | Submit answers and get score |
| `GET` | `/api/quiz/history` | Get past quiz results |

### Health
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Basic health check |
| `GET` | `/api/health` | Detailed health check (model info, doc count) |

---

## 🗄️ Database Schema

```
users
├── id (PK)
├── email (unique)
├── password_hash
├── name
└── created_at

chat_sessions
├── id (PK)
├── user_id (FK → users)
├── title
├── created_at
└── updated_at

chat_messages
├── id (PK)
├── session_id (FK → chat_sessions)
├── role (user/ai)
├── content
├── sources_json (JSON)
└── created_at

documents
├── id (PK)
├── user_id (FK → users)
├── name
├── file_path
├── page_count
├── chunk_count
└── created_at

document_chunks
├── id (PK)
├── document_id (FK → documents)
├── user_id
├── doc_name
├── page_num
├── content
└── created_at

quizzes
├── id (PK)
├── user_id (FK → users)
├── topic
├── difficulty
├── score
├── total_questions
└── created_at

quiz_questions
├── id (PK)
├── quiz_id (FK → quizzes)
├── question_text
├── options (JSON)
├── correct_answer
├── explanation
├── user_answer
└── is_correct
```

---

## 🔄 RAG Pipeline

```
User Question
    │
    ▼
┌─────────────────┐
│  Vector Search   │  ← ChromaDB similarity search (user-scoped, optional doc filter)
│  (top-k = 5)     │
└────────┬────────┘
         │ Retrieved chunks with metadata
         ▼
┌─────────────────┐
│  Prompt Builder  │  ← System prompt + context + chat history + question
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Gemini LLM      │  ← Streaming via LangChain LCEL
│  (gemini-2.5-flash)│
└────────┬────────┘
         │ Token stream
         ▼
┌─────────────────┐
│  SSE Response    │  ← token events → sources event → done event
└─────────────────┘
```

---


---


