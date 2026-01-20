'use client';

import { useState, useEffect } from 'react';

/**
 * Hook to detect user's reduced motion preference
 * Returns true if user prefers reduced motion
 */
export function useReducedMotion(): boolean {
    const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

    useEffect(() => {
        // Check if window is available (client-side)
        if (typeof window === 'undefined') return;

        const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

        // Set initial value
        setPrefersReducedMotion(mediaQuery.matches);

        // Listen for changes
        const handleChange = (event: MediaQueryListEvent) => {
            setPrefersReducedMotion(event.matches);
        };

        mediaQuery.addEventListener('change', handleChange);

        return () => {
            mediaQuery.removeEventListener('change', handleChange);
        };
    }, []);

    return prefersReducedMotion;
}

/**
 * Returns animation props for Framer Motion based on reduced motion preference
 */
export function useMotionSafe() {
    const prefersReducedMotion = useReducedMotion();

    return {
        // Use these for initial/animate/exit
        animate: prefersReducedMotion ? false : undefined,
        transition: prefersReducedMotion
            ? { duration: 0 }
            : undefined,

        // Helpers for conditional animations
        prefersReducedMotion,
        safeAnimate: <T>(normalValue: T, reducedValue: T): T =>
            prefersReducedMotion ? reducedValue : normalValue,
    };
}

/**
 * Hook for high contrast mode detection
 */
export function useHighContrast(): boolean {
    const [prefersHighContrast, setPrefersHighContrast] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const mediaQuery = window.matchMedia('(prefers-contrast: high)');
        setPrefersHighContrast(mediaQuery.matches);

        const handleChange = (event: MediaQueryListEvent) => {
            setPrefersHighContrast(event.matches);
        };

        mediaQuery.addEventListener('change', handleChange);

        return () => {
            mediaQuery.removeEventListener('change', handleChange);
        };
    }, []);

    return prefersHighContrast;
}

/**
 * Hook for dark mode preference detection
 */
export function useDarkMode(): boolean {
    const [prefersDarkMode, setPrefersDarkMode] = useState(true);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        setPrefersDarkMode(mediaQuery.matches);

        const handleChange = (event: MediaQueryListEvent) => {
            setPrefersDarkMode(event.matches);
        };

        mediaQuery.addEventListener('change', handleChange);

        return () => {
            mediaQuery.removeEventListener('change', handleChange);
        };
    }, []);

    return prefersDarkMode;
}
