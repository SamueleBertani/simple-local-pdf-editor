import { useEffect, useState, useRef, type RefObject } from 'react';

interface UseInViewOptions extends IntersectionObserverInit {
    triggerOnce?: boolean;
}

/**
 * Custom hook to detect when an element is in the viewport.
 * @param options IntersectionObserver options
 * @returns [ref, isInView]
 */
export function useInView(options: UseInViewOptions = {}): [RefObject<HTMLDivElement | null>, boolean] {
    const ref = useRef<HTMLDivElement>(null);
    const [isInView, setIsInView] = useState(false);
    const { threshold, root, rootMargin, triggerOnce } = options;

    useEffect(() => {
        const element = ref.current;
        if (!element) return;

        const callback: IntersectionObserverCallback = ([entry]) => {
            if (entry.isIntersecting) {
                setIsInView(true);
                if (triggerOnce && element) {
                    observer.unobserve(element);
                }
            } else if (!triggerOnce) {
                setIsInView(false);
            }
        };

        const observer = new IntersectionObserver(callback, {
            threshold,
            root,
            rootMargin,
        });

        observer.observe(element);

        return () => {
            if (element) {
                observer.unobserve(element);
            }
        };
    }, [threshold, root, rootMargin, triggerOnce]);

    return [ref, isInView];
}
