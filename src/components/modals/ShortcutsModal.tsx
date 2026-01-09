import { BaseModal, ModalCancelButton } from '../ui/BaseModal';

interface ShortcutsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;
const cmdKey = isMac ? '⌘' : 'Ctrl';

interface ShortcutSection {
    title: string;
    shortcuts: { keys: string; description: string }[];
}

const sections: ShortcutSection[] = [
    {
        title: 'Tools',
        shortcuts: [
            { keys: 'S', description: 'Select' },
            { keys: 'H', description: 'Sign' },
            { keys: 'T', description: 'Text' },
            { keys: 'R', description: 'Cover' },
            { keys: 'I', description: 'Image' },
            { keys: 'P', description: 'Stamp' },
        ],
    },
    {
        title: 'Edit',
        shortcuts: [
            { keys: `${cmdKey}Z`, description: 'Undo' },
            { keys: `${cmdKey}⇧Z`, description: 'Redo' },
            { keys: `${cmdKey}C`, description: 'Copy' },
            { keys: `${cmdKey}V`, description: 'Paste' },
            { keys: `${cmdKey}D`, description: 'Duplicate' },
            { keys: 'Del', description: 'Delete' },
            { keys: 'Esc', description: 'Deselect' },
        ],
    },
    {
        title: 'Navigation',
        shortcuts: [
            { keys: '←→↑↓', description: 'Nudge 1px' },
            { keys: '⇧+Arrows', description: 'Nudge 10px' },
            { keys: 'Ctrl+Scroll', description: 'Zoom' },
        ],
    },
    {
        title: 'Export',
        shortcuts: [
            { keys: `${cmdKey}S`, description: 'Save PDF' },
            { keys: `${cmdKey}⇧S`, description: 'Save PNG' },
        ],
    },
];

function ShortcutItem({ keys, description }: { keys: string; description: string }) {
    return (
        <div className="flex items-center justify-between py-1">
            <span className="text-sm text-slate-600 dark:text-slate-400">
                {description}
            </span>
            <kbd className="px-1.5 py-0.5 text-xs font-mono bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded border border-slate-200 dark:border-slate-700">
                {keys}
            </kbd>
        </div>
    );
}

function ShortcutSection({ title, shortcuts }: ShortcutSection) {
    return (
        <div>
            <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-500 uppercase tracking-wide mb-2">
                {title}
            </h3>
            <div className="space-y-0.5">
                {shortcuts.map((shortcut) => (
                    <ShortcutItem key={shortcut.keys} {...shortcut} />
                ))}
            </div>
        </div>
    );
}

export function ShortcutsModal({ isOpen, onClose }: ShortcutsModalProps) {
    return (
        <BaseModal
            isOpen={isOpen}
            onClose={onClose}
            title="Keyboard Shortcuts"
            maxWidth="max-w-md"
        >
            <div className="grid grid-cols-2 gap-6">
                <div className="space-y-5">
                    <ShortcutSection {...sections[0]} />
                    <ShortcutSection {...sections[2]} />
                </div>
                <div className="space-y-5">
                    <ShortcutSection {...sections[1]} />
                    <ShortcutSection {...sections[3]} />
                </div>
            </div>
            <div className="mt-6">
                <ModalCancelButton onClick={onClose}>
                    Cancel
                </ModalCancelButton>
            </div>
        </BaseModal>
    );
}
