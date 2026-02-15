import type { ChangeEvent, DragEvent } from 'react';
import { Upload, Github } from 'lucide-react';
import { cn } from '../../utils/cn';
import { Button } from '../ui/Button';

/**
 * Props for the UploadDropzone component.
 */
interface UploadDropzoneProps {
  /** Whether a file is currently being dragged over the drop zone */
  isDragging: boolean;
  /**
   * Handler for file input change events.
   * @param event - The change event from the file input
   */
  onFileUpload: (event: ChangeEvent<HTMLInputElement>) => void;
  /**
   * Handler for drag over events.
   * @param e - The drag event
   */
  onDragOver: (e: DragEvent) => void;
  /**
   * Handler for drag leave events.
   * @param e - The drag event
   */
  onDragLeave: (e: DragEvent) => void;
  /**
   * Handler for drop events.
   * @param e - The drag event containing the dropped file
   */
  onDrop: (e: DragEvent) => void;
}

/**
 * Upload dropzone component for PDF file selection.
 * Provides both drag-and-drop and click-to-select file upload functionality.
 *
 * @param props - Component props
 * @returns The upload dropzone UI
 *
 * @example
 * ```tsx
 * <UploadDropzone
 *   isDragging={isDragging}
 *   onFileUpload={handleFileUpload}
 *   onDragOver={handleDragOver}
 *   onDragLeave={handleDragLeave}
 *   onDrop={handleDrop}
 * />
 * ```
 */
export function UploadDropzone({
  isDragging,
  onFileUpload,
  onDragOver,
  onDragLeave,
  onDrop
}: UploadDropzoneProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
      <div className="flex flex-col items-center gap-4 mb-8">
        <h1 className="text-4xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">
          PDF Editor
        </h1>
      </div>

      <div
        className={cn(
          "bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-sm border-2 flex flex-col items-center max-w-md w-full mx-4 transition-all duration-200",
          isDragging
            ? "border-primary-500 bg-primary-100 dark:bg-primary-900/20 scale-105"
            : "border-slate-200 dark:border-slate-800 border-dashed"
        )}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        <Upload
          className={cn(
            "w-12 h-12 mb-4 transition-colors",
            isDragging ? "text-primary-500 dark:text-primary-400" : "text-slate-300 dark:text-slate-600"
          )}
        />
        <p
          className={cn(
            "text-lg font-medium text-center mb-1 transition-colors",
            isDragging ? "text-primary-700 dark:text-primary-300" : "text-slate-600 dark:text-slate-300"
          )}
        >
          {isDragging ? "Drop PDF here" : "Upload a PDF to start editing"}
        </p>
        <p
          className={cn(
            "text-sm text-center mb-6 transition-colors",
            isDragging ? "text-primary-600 dark:text-primary-400" : "text-slate-400 dark:text-slate-500"
          )}
        >
          {isDragging ? "Release to open" : "Drag & Drop or click to select"}
        </p>

        <div className="relative w-full">
          <input
            type="file"
            accept="application/pdf"
            onChange={onFileUpload}
            className="absolute inset-0 opacity-0 cursor-pointer z-20"
          />
          <Button size="lg" className="w-full relative z-10 pointer-events-none">
            Select Document
          </Button>
        </div>
      </div>

      <a
        href="https://github.com/SamueleBertani/simple-local-pdf-editor"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-8 flex items-center gap-2 text-sm text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
      >
        <Github className="w-4 h-4" />
        View on GitHub
      </a>
    </div>
  );
}
