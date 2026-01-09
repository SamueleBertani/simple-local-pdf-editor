import { BaseModal, ModalCancelButton } from '../ui/BaseModal';

interface ShortcutsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;
const cmdKey = isMac ? '⌘' : 'Ctrl';

const shortcuts = [
    { keys: `${cmdKey} + Z`, description: 'Undo' },
    { keys: `${cmdKey} + Shift + Z`, description: 'Redo' },
    { keys: `${cmdKey} + C`, description: 'Copy' },
    { keys: `${cmdKey} + V`, description: 'Paste' },
    { keys: `${cmdKey} + D`, description: 'Duplicate' },
    { keys: 'Delete / Backspace', description: 'Delete selected' },
    { keys: 'Escape', description: 'Deselect all' },
    { keys: '← → ↑ ↓', description: 'Nudge (1px)' },
    { keys: 'Shift + Arrows', description: 'Nudge (10px)' },
    { keys: 'Ctrl + Scroll', description: 'Zoom' },
];

export function ShortcutsModal({ isOpen, onClose }: ShortcutsModalProps) {
    return (
        <BaseModal
            isOpen={isOpen}
            onClose={onClose}
            title="Keyboard Shortcuts"
            maxWidth="max-w-sm"
        >
            <div className="space-y-2">
                {shortcuts.map((shortcut) => (
                    <div
                        key={shortcut.keys}
                        className="flex items-center justify-between py-1.5"
                    >
                        <span className="text-sm text-slate-600 dark:text-slate-400">
                            {shortcut.description}
                        </span>
                        <kbd className="px-2 py-1 text-xs font-mono bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded border border-slate-200 dark:border-slate-700">
                            {shortcut.keys}
                        </kbd>
                    </div>
                ))}
            </div>
            <div className="mt-6">
                <ModalCancelButton onClick={onClose}>
                    Cancel
                </ModalCancelButton>
            </div>
        </BaseModal>
    );
}
