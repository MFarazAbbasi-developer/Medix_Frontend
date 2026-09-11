import { useEffect } from 'react';

/**
 * Custom hook to lock body scrolling when a modal/drawer overlay is active.
 * Restores the original overflow style on unmount or when locked becomes false.
 */
export const useScrollLock = (locked: boolean = false) => {
  useEffect(() => {
    if (!locked) return;

    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, [locked]);
};
