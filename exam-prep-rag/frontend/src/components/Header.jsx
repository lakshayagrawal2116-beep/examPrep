import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useDocuments } from '../hooks/useDocuments';
import DocSelector from './DocSelector';
import ThemeToggle from './ThemeToggle';

export default function Header() {
  const { documents, selectedDocIds, setSelectedDocIds, setSidebarOpen, setUploadModalOpen } = useApp();
  const { remove } = useDocuments();
  const [deleting, setDeleting] = useState(null);

  const handleDelete = async (docId) => {
    if (deleting) return;
    setDeleting(docId);
    try {
      await remove(docId);
      if (selectedDocIds.includes(docId)) {
        setSelectedDocIds(prev => prev.filter(id => id !== docId));
      }
    } catch (err) {
      console.error('Delete failed:', err);
    } finally {
      setDeleting(null);
    }
  };

  return (
    <header className="header">
      <div className="header-left">
        <button
          className="btn-icon mobile-menu-btn"
          onClick={() => setSidebarOpen(prev => !prev)}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <div>
          <div className="header-title">ExamPrep AI</div>
          <div className="header-subtitle">Ask anything about your study materials</div>
        </div>
      </div>

      <div className="header-right">
        <DocSelector
          documents={documents}
          selectedIds={selectedDocIds}
          onChange={setSelectedDocIds}
          allMeansNone={true}
          onDelete={handleDelete}
          deleting={deleting}
          compact={false}
        />

        <ThemeToggle />

        <button
          className="header-upload-btn"
          onClick={() => setUploadModalOpen(true)}
          title="Upload document (PDF, DOCX, PPTX, TXT)"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M8 2v12M2 8h12" />
          </svg>
          <span>Upload</span>
        </button>
      </div>
    </header>
  );
}
