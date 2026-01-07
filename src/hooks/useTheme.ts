import { useEffect, useState } from 'react';

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

    // Listen for system changes ONLY if no localStorage override exists?
    // Actually, simple approach: manual override wins. 
    // If we want system to drive it again, user would need to "clear" setting.
    // For now, let's just stick to manual toggle + initial system detection.

    const toggleTheme = () => {
        setTheme(prev => prev === 'dark' ? 'light' : 'dark');
    };

    return { theme, toggleTheme };
}
