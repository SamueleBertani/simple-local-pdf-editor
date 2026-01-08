import { useEffect } from 'react';
import { useHistoryStore } from '../../store/useHistoryStore';

export function useUndoRedoShortcuts() {
    const { undo, redo } = useHistoryStore();

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
                return;
            }

            const isCmdOrCtrl = e.metaKey || e.ctrlKey;

            // Undo: Cmd+Z
            if (isCmdOrCtrl && e.key === 'z' && !e.shiftKey) {
                e.preventDefault();
                undo();
                return;
            }

            // Redo: Cmd+Shift+Z or Cmd+Y
            if ((isCmdOrCtrl && e.key === 'z' && e.shiftKey) || (isCmdOrCtrl && e.key === 'y')) {
                e.preventDefault();
                redo();
                return;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [undo, redo]);
}
