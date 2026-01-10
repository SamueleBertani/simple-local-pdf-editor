import type { ChangeEvent, DragEvent } from 'react';
import { useState, useCallback } from 'react';
import { PDFJS } from '../core/pdf/pdfWorker';
import { usePDFStore } from '../store/usePDFStore';
import { useNotificationStore } from '../store/useNotificationStore';

/**
 * Return type for the useFileUpload hook.
 */
interface UseFileUploadReturn {
  /** Whether a file is currently being dragged over the drop zone */
  isDragging: boolean;
  /**
   * Handler for file input change events.
   * @param event - The change event from the file input
   */
  handleFileUpload: (event: ChangeEvent<HTMLInputElement>) => Promise<void>;
  /**
   * Handler for drag over events on the drop zone.
   * @param e - The drag event
   */
  handleDragOver: (e: DragEvent) => void;
  /**
   * Handler for drag leave events on the drop zone.
   * @param e - The drag event
   */
  handleDragLeave: (e: DragEvent) => void;
  /**
   * Handler for drop events on the drop zone.
   * @param e - The drag event containing the dropped file
   */
  handleDrop: (e: DragEvent) => Promise<void>;
}

/**
 * Custom hook to manage PDF file upload functionality.
 * Handles both file input selection and drag-and-drop upload.
 *
 * @returns Object containing drag state and event handlers for file upload
 *
 * @example
 * ```tsx
 * const { isDragging, handleFileUpload, handleDragOver, handleDragLeave, handleDrop } = useFileUpload();
 *
 * return (
 *   <div
 *     onDragOver={handleDragOver}
 *     onDragLeave={handleDragLeave}
 *     onDrop={handleDrop}
 *   >
 *     <input type="file" onChange={handleFileUpload} />
 *   </div>
 * );
 * ```
 */
export function useFileUpload(): UseFileUploadReturn {
  const { setPdfDocument } = usePDFStore();
  const { addNotification } = useNotificationStore();
  const [isDragging, setIsDragging] = useState(false);

  /**
   * Loads a PDF file and sets it in the store.
   * @param file - The PDF file to load
   */
  const loadFile = useCallback(async (file: File) => {
    if (file.type !== 'application/pdf') {
      addNotification({
        type: 'error',
        title: 'Invalid File',
        message: 'Please upload a valid PDF file'
      });
      return;
    }

    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = PDFJS.getDocument({
      data: arrayBuffer,
      verbosity: PDFJS.VerbosityLevel.ERRORS,
    });
    const doc = await loadingTask.promise;

    // Extract filename without extension
    const fileNameWithoutExt = file.name.replace(/\.pdf$/i, '');
    setPdfDocument(doc, fileNameWithoutExt);
  }, [setPdfDocument, addNotification]);

  const handleFileUpload = useCallback(async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await loadFile(file);
  }, [loadFile]);

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(async (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    await loadFile(file);
  }, [loadFile]);

  return {
    isDragging,
    handleFileUpload,
    handleDragOver,
    handleDragLeave,
    handleDrop
  };
}
