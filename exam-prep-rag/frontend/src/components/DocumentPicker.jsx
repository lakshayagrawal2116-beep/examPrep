import { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useDocuments } from '../hooks/useDocuments';

export default function DocumentPicker() {
  const { documents, selectedDocIds, setSelectedDocIds } = useApp();
  const { remove } = useDocuments();
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (documents.length === 0) return null;

  const allSelected = selectedDocIds.length === 0;
  const selectedCount = allSelected ? documents.length : selectedDocIds.length;

  const toggleDoc = (docId) => {
    if (allSelected) {
      setSelectedDocIds(documents.filter(d => d.id !== docId).map(d => d.id));
    } else {
      if (selectedDocIds.includes(docId)) {
        const next = selectedDocIds.filter(id => id !== docId);
        setSelectedDocIds(next.length === 0 ? [] : next);
      } else {
        const next = [...selectedDocIds, docId];
        setSelectedDocIds(next.length === documents.length ? [] : next);
      }
    }
  };

  const selectAll = () => setSelectedDocIds([]);
  const isDocSelected = (docId) => allSelected || selectedDocIds.includes(docId);

  const handleDelete = async (e, docId) => {
    e.stopPropagation();
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

  const label = allSelected
    ? `All Documents (${documents.length})`
    : selectedCount === 1
      ? documents.find(d => d.id === selectedDocIds[0])?.name || '1 selected'
      : `${selectedCount} of ${documents.length} selected`;

  return (
    <div className="doc-picker" ref={ref}>
      <button
        className="doc-picker-trigger"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <span className="doc-picker-icon">📚</span>
        <span className="doc-picker-label">{label}</span>
        <span className={`doc-picker-arrow ${open ? 'open' : ''}`}>▾</span>
      </button>

      {open && (
        <div className="doc-picker-dropdown">
          <div className="doc-picker-header">
            <span className="doc-picker-header-title">Select Documents</span>
            <button className="doc-picker-select-all" onClick={selectAll}>
              {allSelected ? '✓ All' : 'Select All'}
            </button>
          </div>

          <div className="doc-picker-list">
            {documents.map(doc => (
              <div key={doc.id} className="doc-picker-item">
                <div
                  className="doc-picker-item-left"
                  onClick={() => toggleDoc(doc.id)}
                >
                  <div className={`doc-picker-checkmark ${isDocSelected(doc.id) ? 'checked' : ''}`}>
                    {isDocSelected(doc.id) && '✓'}
                  </div>
                  <div className="doc-picker-item-info">
                    <span className="doc-picker-item-name">{doc.name}</span>
                    <span className="doc-picker-item-meta">
                      {doc.page_count} pages · {doc.chunk_count} chunks
                    </span>
                  </div>
                </div>
                <button
                  className="doc-picker-delete"
                  onClick={(e) => handleDelete(e, doc.id)}
                  title={`Delete ${doc.name}`}
                  disabled={deleting === doc.id}
                >
                  {deleting === doc.id ? (
                    <span className="doc-picker-delete-spinner" />
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                      <path d="M10 11v6M14 11v6" />
                    </svg>
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
