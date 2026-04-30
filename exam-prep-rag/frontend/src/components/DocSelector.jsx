import { useState, useRef, useEffect } from 'react';

/**
 * Reusable document multi-select dropdown with search, Select All, and compact UI.
 *
 * Props:
 *  - documents: Array of { id, name, page_count, chunk_count }
 *  - selectedIds: Array of selected doc IDs (empty = all selected)
 *  - onChange: (newSelectedIds) => void
 *  - allMeansNone: if true, empty array = "all selected" (header behavior).
 *                  if false, empty array = "none selected" (quiz behavior).
 *  - onDelete: optional (docId) => void — shows delete button per doc
 *  - deleting: optional string — doc ID currently being deleted
 *  - compact: if true, renders inline (for quiz form). if false, renders as floating dropdown (for header).
 */
export default function DocSelector({
  documents,
  selectedIds,
  onChange,
  allMeansNone = true,
  onDelete,
  deleting,
  compact = false,
}) {
  const [open, setOpen] = useState(compact); // compact mode starts open
  const [search, setSearch] = useState('');
  const ref = useRef(null);

  // Close dropdown on click outside (only for non-compact mode)
  useEffect(() => {
    if (compact) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [compact]);

  if (documents.length === 0) {
    if (compact) return <p className="doc-sel-empty">No documents uploaded yet.</p>;
    return null;
  }

  const filtered = documents.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase())
  );

  // Selection helpers
  const isSelected = (docId) => {
    if (allMeansNone) {
      return selectedIds.length === 0 || selectedIds.includes(docId);
    }
    return selectedIds.includes(docId);
  };

  const allSelected = allMeansNone
    ? selectedIds.length === 0
    : selectedIds.length === documents.length;

  const noneSelected = allMeansNone
    ? false
    : selectedIds.length === 0;

  const selectedCount = allMeansNone
    ? (selectedIds.length === 0 ? documents.length : selectedIds.length)
    : selectedIds.length;

  const toggleDoc = (docId) => {
    if (allMeansNone) {
      if (selectedIds.length === 0) {
        // Currently all selected — deselect this one
        onChange(documents.filter(d => d.id !== docId).map(d => d.id));
      } else {
        if (selectedIds.includes(docId)) {
          const next = selectedIds.filter(id => id !== docId);
          onChange(next.length === 0 ? [] : next);
        } else {
          const next = [...selectedIds, docId];
          onChange(next.length === documents.length ? [] : next);
        }
      }
    } else {
      if (selectedIds.includes(docId)) {
        onChange(selectedIds.filter(id => id !== docId));
      } else {
        onChange([...selectedIds, docId]);
      }
    }
  };

  const handleSelectAll = () => {
    if (allMeansNone) {
      onChange([]);
    } else {
      onChange(allSelected ? [] : documents.map(d => d.id));
    }
  };

  // Trigger label
  const label = allMeansNone
    ? (selectedIds.length === 0
        ? `All Documents (${documents.length})`
        : selectedCount === 1
          ? documents.find(d => d.id === selectedIds[0])?.name || '1 selected'
          : `${selectedCount} of ${documents.length}`)
    : (selectedIds.length === 0
        ? 'Select documents...'
        : selectedCount === documents.length
          ? `All (${documents.length})`
          : `${selectedCount} of ${documents.length} selected`);

  const listContent = (
    <>
      {/* Search + Select All header */}
      <div className="doc-sel-toolbar">
        {documents.length > 4 && (
          <div className="doc-sel-search-wrap">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input
              className="doc-sel-search"
              type="text"
              placeholder="Search documents..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus={!compact}
            />
          </div>
        )}
        <div className="doc-sel-actions">
          <button type="button" className="doc-sel-action-btn" onClick={handleSelectAll}>
            {allSelected ? '✓ All' : 'Select All'}
          </button>
          {!allMeansNone && selectedIds.length > 0 && (
            <button type="button" className="doc-sel-action-btn" onClick={() => onChange([])}>
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Document list */}
      <div className="doc-sel-list">
        {filtered.length === 0 && (
          <p className="doc-sel-empty">No documents match "{search}"</p>
        )}
        {filtered.map(doc => (
          <div key={doc.id} className={`doc-sel-item ${isSelected(doc.id) ? 'selected' : ''}`}>
            <div className="doc-sel-item-left" onClick={() => toggleDoc(doc.id)}>
              <div className={`doc-sel-check ${isSelected(doc.id) ? 'checked' : ''}`}>
                {isSelected(doc.id) && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                )}
              </div>
              <span className="doc-sel-name">{doc.name}</span>
              <span className="doc-sel-meta">{doc.page_count} pg</span>
            </div>
            {onDelete && (
              <button
                type="button"
                className="doc-sel-delete"
                onClick={(e) => { e.stopPropagation(); onDelete(doc.id); }}
                title={`Delete ${doc.name}`}
                disabled={deleting === doc.id}
              >
                {deleting === doc.id ? (
                  <span className="doc-sel-delete-spinner" />
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                    <path d="M10 11v6M14 11v6" />
                  </svg>
                )}
              </button>
            )}
          </div>
        ))}
      </div>
    </>
  );

  // Compact mode: renders inline inside a form
  if (compact) {
    return (
      <div className="doc-sel-compact" ref={ref}>
        {listContent}
      </div>
    );
  }

  // Dropdown mode: renders as a floating popover from a trigger button
  return (
    <div className="doc-sel-dropdown-wrap" ref={ref}>
      <button
        className="doc-sel-trigger"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <span className="doc-sel-trigger-icon">📚</span>
        <span className="doc-sel-trigger-label">{label}</span>
        <span className={`doc-sel-arrow ${open ? 'open' : ''}`}>▾</span>
      </button>

      {open && (
        <div className="doc-sel-dropdown">
          {listContent}
        </div>
      )}
    </div>
  );
}
