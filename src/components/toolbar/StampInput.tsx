import { useState, useRef, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import { useToolStore } from '../../store/useToolStore';
import { cn } from '../../utils/cn';

const STORAGE_KEY = 'pdf-editor-stamps';

interface SavedStamp {
    id: string;
    url: string;
    label: string;
}

export function StampInput() {
    const { setPendingImage, pendingImage } = useToolStore();
    const [stamps, setStamps] = useState<SavedStamp[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Carica le firme salvate da localStorage all'avvio
    useEffect(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                setStamps(JSON.parse(saved));
            }
        } catch {
            // Ignora errori di parsing
        }
    }, []);

    // Salva le firme in localStorage quando cambiano
    const saveStamps = (newStamps: SavedStamp[]) => {
        setStamps(newStamps);
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(newStamps));
        } catch {
            // localStorage pieno o non disponibile
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            const url = event.target?.result as string;
            const newStamp: SavedStamp = {
                id: `stamp_${Date.now()}`,
                url,
                label: `Firma ${stamps.length + 1}`
            };
            saveStamps([...stamps, newStamp]);
            setPendingImage(url);
        };
        reader.readAsDataURL(file);

        // Reset input per permettere di caricare la stessa immagine
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleRemoveStamp = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const stampToRemove = stamps.find(s => s.id === id);
        saveStamps(stamps.filter(s => s.id !== id));

        // Se la firma rimossa era selezionata, deseleziona
        if (stampToRemove && pendingImage === stampToRemove.url) {
            setPendingImage(null);
        }
    };

    return (
        <div className="w-full flex flex-col gap-6">
            <h3 className="text-sm font-semibold mb-3 sr-only">Stamp Selection</h3>

            <div className="grid grid-cols-2 gap-3">
                {/* Firme caricate dall'utente */}
                {stamps.map((stamp) => {
                    const isSelected = pendingImage === stamp.url;
                    return (
                        <button
                            key={stamp.id}
                            onClick={() => setPendingImage(stamp.url)}
                            className={cn(
                                "group relative flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all",
                                isSelected
                                    ? "border-primary-500 bg-primary-100 dark:bg-primary-900/20 shadow-sm"
                                    : "border-slate-200 dark:border-slate-700 hover:border-primary-300 dark:hover:border-primary-500 hover:bg-slate-50 dark:hover:bg-slate-800"
                            )}
                        >
                            {/* Bottone rimuovi */}
                            <button
                                onClick={(e) => handleRemoveStamp(stamp.id, e)}
                                className="absolute top-1 right-1 p-1 rounded-full bg-slate-200 dark:bg-slate-700 hover:bg-red-100 dark:hover:bg-red-900/30 text-slate-500 hover:text-red-500 transition-colors z-10"
                            >
                                <X className="w-3 h-3" />
                            </button>

                            <div className="w-full aspect-square flex items-center justify-center bg-white dark:bg-slate-800 rounded-lg p-2 border border-slate-100 dark:border-slate-700">
                                <img
                                    src={stamp.url}
                                    alt={stamp.label}
                                    className="max-w-full max-h-full object-contain opacity-90 group-hover:opacity-100 transition-opacity"
                                />
                            </div>
                            <span className={cn(
                                "text-xs font-medium text-center",
                                isSelected
                                    ? "text-primary-700 dark:text-primary-300"
                                    : "text-slate-600 dark:text-slate-400"
                            )}>
                                {stamp.label}
                            </span>

                            {isSelected && (
                                <div className="absolute top-2 left-2 w-2 h-2 rounded-full bg-primary-500 animate-in zoom-in" />
                            )}
                        </button>
                    );
                })}

                {/* Box per aggiungere nuova firma */}
                <button
                    onClick={() => fileInputRef.current?.click()}
                    className={cn(
                        "group relative flex flex-col items-center justify-center gap-2 p-3 rounded-xl border-2 border-dashed transition-all",
                        "border-slate-300 dark:border-slate-600 hover:border-primary-400 dark:hover:border-primary-500",
                        "hover:bg-primary-50 dark:hover:bg-primary-900/10"
                    )}
                >
                    <div className="w-full aspect-square flex items-center justify-center">
                        <Plus className="w-8 h-8 text-slate-400 dark:text-slate-500 group-hover:text-primary-500 transition-colors" />
                    </div>
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                        Aggiungi firma
                    </span>
                </button>
            </div>

            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
            />

            <p className="text-xs text-slate-400 text-center mt-4">
                {stamps.length === 0
                    ? "Carica un'immagine per usarla come firma"
                    : "Seleziona una firma e clicca sul canvas per posizionarla"
                }
            </p>
        </div>
    );
}
