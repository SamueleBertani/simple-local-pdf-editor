import { useEffect, useState } from 'react';

/**
 * Custom hook to manage the application theme (Light/Dark).
 * Supports manual toggling and persistence via localStorage.
 * Defaults to manual override if present, otherwise falls back to system preference.
 */
export function useTheme() {
    // Initialize state
    const [theme, setTheme] = useState<'light' | 'dark'>(() => {
        if (typeof window === 'undefined') return 'light';

        // 1. Check localStorage
        const saved = localStorage.getItem('theme');
        if (saved === 'dark' || saved === 'light') return saved;

        // 2. Check System Preference
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }

        return 'light';
    });

    // Apply theme to DOM
    useEffect(() => {
        const root = window.document.documentElement;
        if (theme === 'dark') {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
        localStorage.setItem('theme', theme);
    }, [theme]);

    /**
     * Toggles between light and dark mode.
     */
    const toggleTheme = () => {
        setTheme(prev => prev === 'dark' ? 'light' : 'dark');
    };

    return { theme, toggleTheme };
}
