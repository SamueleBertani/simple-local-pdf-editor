import { useState } from 'react';
import { Download, FileDown, Image, Keyboard, Moon, Sun } from 'lucide-react';
import { Toolbar } from '../toolbar/Toolbar';
import { ShortcutsModal } from '../modals/ShortcutsModal';
import { Z_INDEX } from '../../constants/zIndex';

/**
 * Props for the DesktopSidebar component.
 */
interface DesktopSidebarProps {
  /** Current theme ('light' or 'dark') */
  theme: 'light' | 'dark';
  /** Handler to toggle between light and dark themes */
  onToggleTheme: () => void;
  /** Handler for quick PDF save (immediate download) */
  onQuickSavePDF: () => void;
  /** Handler for PDF export with compression options */
  onExportPDF: () => void;
  /** Handler for scanner export action */
  onScannerExport: () => void;
}

/**
 * Desktop sidebar component containing tools and action buttons.
 * Displays the toolbar, export options, theme toggle, and close file button.
 * Only visible on desktop viewport sizes (md breakpoint and above).
 *
 * @param props - Component props
 * @returns The desktop sidebar UI
 *
 * @example
 * ```tsx
 * <DesktopSidebar
 *   theme={theme}
 *   onToggleTheme={toggleTheme}
 *   onExportPDF={handleExportPDF}
 *   onScannerExport={startScannerFlow}
 * />
 * ```
 */
export function DesktopSidebar({
  theme,
  onToggleTheme,
  onQuickSavePDF,
  onExportPDF,
  onScannerExport
}: DesktopSidebarProps) {
  const [showShortcuts, setShowShortcuts] = useState(false);

  return (
    <div
      className="hidden md:flex w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex-col items-center py-6 gap-6 shrink-0 relative h-full"
      style={{ zIndex: Z_INDEX.UI.SIDEBAR }}
    >
      {/* Tools */}
      <Toolbar />

      <div className="flex-1" />

      {/* Icon buttons */}
      <div className="flex gap-2 px-4">
        <button
          onClick={onToggleTheme}
          className="p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          title={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
        <button
          onClick={() => setShowShortcuts(true)}
          className="p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          title="Keyboard Shortcuts"
          aria-label="Show keyboard shortcuts"
        >
          <Keyboard className="w-5 h-5" />
        </button>
      </div>

      <div className="w-full h-px bg-slate-200 dark:bg-slate-800" />

      {/* Actions */}
      <div className="flex flex-col gap-3 w-full px-4">
        <button
          onClick={onQuickSavePDF}
          className="flex items-center gap-3 text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 w-full"
          title="Save PDF (high quality)"
        >
          <Download className="w-5 h-5" />
          <span className="text-sm font-medium">Save PDF</span>
        </button>

        <button
          onClick={onExportPDF}
          className="flex items-center gap-3 text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 w-full"
          title="Minimize PDF (compression options)"
        >
          <FileDown className="w-5 h-5" />
          <span className="text-sm font-medium">Minimize PDF</span>
        </button>

        <button
          onClick={onScannerExport}
          className="flex items-center gap-3 text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 w-full"
          title="Scanner Export (PNG)"
        >
          <Image className="w-5 h-5" />
          <span className="text-sm font-medium">Save PNG (Scan)</span>
        </button>

        <button
          onClick={() => window.location.reload()}
          className="flex items-center gap-3 text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 transition-colors p-3 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 mt-2 w-full"
          title="Close File"
        >
          <span className="text-xl font-bold leading-none w-5 text-center">&times;</span>
          <span className="text-sm font-medium">Close File</span>
        </button>
      </div>

      <ShortcutsModal
        isOpen={showShortcuts}
        onClose={() => setShowShortcuts(false)}
      />
    </div>
  );
}
