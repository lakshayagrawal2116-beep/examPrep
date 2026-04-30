import { useState, useCallback } from 'react';
import { uploadDocument as apiUpload, deleteDocument as apiDelete } from '../utils/api';
import { useApp } from '../context/AppContext';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export function useDocuments() {
  const { refreshDocuments } = useApp();
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState(null); // { type: 'success'|'error', message }

  const upload = useCallback(async (file) => {
    setUploading(true);
    setUploadProgress(10);
    setUploadStatus(null);

    // Client-side validation
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setUploadStatus({ type: 'error', message: 'Only PDF files are supported.' });
      setUploading(false);
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      setUploadStatus({ type: 'error', message: `File too large (${sizeMB}MB). Maximum size is 50MB.` });
      setUploading(false);
      return;
    }

    if (file.size === 0) {
      setUploadStatus({ type: 'error', message: 'File is empty. Please select a valid PDF.' });
      setUploading(false);
      return;
    }

    try {
      setUploadProgress(30);
      const result = await apiUpload(file);
      setUploadProgress(100);
      setUploadStatus({ type: 'success', message: result.message });
      await refreshDocuments();
      return result;
    } catch (err) {
      let message = err.message || 'Upload failed';

      // Provide helpful error messages
      if (message.includes('Failed to fetch') || message.includes('NetworkError')) {
        message = 'Connection failed. Please check if the backend server is running.';
      } else if (message.includes('401') || message.includes('Unauthorized')) {
        message = 'Session expired. Please log in again.';
      } else if (message.includes('413')) {
        message = 'File is too large for the server. Try a smaller PDF.';
      }

      setUploadStatus({ type: 'error', message });
      throw err;
    } finally {
      setUploading(false);
    }
  }, [refreshDocuments]);

  const remove = useCallback(async (docId) => {
    try {
      await apiDelete(docId);
      await refreshDocuments();
    } catch (err) {
      console.error('Delete failed:', err);
      throw new Error(err.message?.includes('Failed to fetch')
        ? 'Connection failed. Please check the backend server.'
        : 'Failed to delete document. Please try again.'
      );
    }
  }, [refreshDocuments]);

  const resetUploadStatus = useCallback(() => {
    setUploadStatus(null);
    setUploadProgress(0);
  }, []);

  return { upload, remove, uploading, uploadProgress, uploadStatus, resetUploadStatus };
}
