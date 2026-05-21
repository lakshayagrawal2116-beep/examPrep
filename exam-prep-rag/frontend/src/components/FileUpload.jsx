import { useRef, useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useDocuments } from '../hooks/useDocuments';
import { useToast } from '../context/ToastContext';

export default function FileUpload() {
  const { uploadModalOpen, setUploadModalOpen, documents } = useApp();
  const { upload, uploading, uploadProgress, uploadStatus, resetUploadStatus } = useDocuments();
  const fileRef = useRef(null);
  const [dragover, setDragover] = useState(false);
  const toast = useToast();

  // Auto-close modal 1.5s after successful upload
  useEffect(() => {
    if (uploadStatus?.type === 'success') {
      const timer = setTimeout(() => {
        setUploadModalOpen(false);
        resetUploadStatus();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [uploadStatus, setUploadModalOpen, resetUploadStatus]);

  if (!uploadModalOpen) return null;

  const handleClose = () => {
    setUploadModalOpen(false);
    resetUploadStatus();
  };

  const handleFile = async (file) => {
    if (!file) return;
    const ext = file.name.toLowerCase().split('.').pop();
    const supported = ['pdf', 'docx', 'pptx', 'txt'];
    if (!supported.includes(ext)) {
      toast.warning('Unsupported file type. Please upload PDF, DOCX, PPTX, or TXT.');
      return;
    }
    try {
      await upload(file);
    } catch {
      // Error state is set by useDocuments hook
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragover(false);
    const file = e.dataTransfer.files[0];
    handleFile(file);
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="upload-modal" onClick={e => e.stopPropagation()}>
        {/* Decorative glow */}
        <div className="upload-modal-glow" />

        <div className="upload-modal-header">
          <div className="upload-modal-title-group">
            <div className="upload-modal-icon-wrap">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </div>
            <div>
              <h2>Upload Study Material</h2>
              <p className="upload-modal-subtitle">PDF, DOCX, PPTX, TXT files supported (up to 50MB)</p>
            </div>
          </div>
          <button className="upload-modal-close" onClick={handleClose}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M4 4l10 10M14 4L4 14" />
            </svg>
          </button>
        </div>

        <div
          className={`upload-dropzone ${dragover ? 'dragover' : ''} ${uploading ? 'uploading' : ''} ${uploadStatus?.type === 'success' ? 'success' : ''}`}
          onClick={() => !uploading && fileRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragover(true); }}
          onDragLeave={() => setDragover(false)}
          onDrop={handleDrop}
        >
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.docx,.pptx,.txt"
            style={{ display: 'none' }}
            onChange={(e) => { handleFile(e.target.files[0]); e.target.value = ''; }}
          />

          {uploadStatus?.type === 'success' ? (
            <div className="upload-success-state">
              <div className="upload-success-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h3>Upload Complete!</h3>
              <p className="upload-success-message">{uploadStatus.message}</p>
              <span className="upload-auto-close">Closing automatically...</span>
            </div>
          ) : uploading ? (
            <div className="upload-loading-state">
              <div className="upload-spinner">
                <div className="upload-spinner-ring" />
              </div>
              <h3>Processing your document...</h3>
              <p>Extracting text and creating embeddings</p>
              <div className="upload-progress-bar">
                <div className="upload-progress-fill" style={{ width: `${uploadProgress}%` }} />
              </div>
            </div>
          ) : (
            <div className="upload-idle-state">
              <div className="upload-idle-icon">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              </div>
              <h3>Drop your file here</h3>
              <p>or click anywhere to browse files</p>
              <div className="upload-file-types">
                <span className="upload-file-badge">.PDF</span>
                <span className="upload-file-badge">.DOCX</span>
                <span className="upload-file-badge">.PPTX</span>
                <span className="upload-file-badge">.TXT</span>
              </div>
            </div>
          )}
        </div>

        {uploadStatus?.type === 'error' && (
          <div className="upload-error-banner">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            {uploadStatus.message}
          </div>
        )}

        {/* Show existing documents count */}
        {documents.length > 0 && !uploading && !uploadStatus && (
          <div className="upload-doc-count">
            You have <strong>{documents.length}</strong> document{documents.length !== 1 ? 's' : ''} indexed
          </div>
        )}
      </div>
    </div>
  );
}
