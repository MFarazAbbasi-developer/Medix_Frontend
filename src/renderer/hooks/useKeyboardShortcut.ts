import { useEffect, useCallback } from 'react';

export interface KeyboardShortcutOptions {
  key: string;
  ctrlKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
  metaKey?: boolean;
  enabled?: boolean;
  preventDefault?: boolean;
}

/**
 * Custom hook to register keyboard shortcuts with desktop focus handling.
 */
export const useKeyboardShortcut = (
  options: KeyboardShortcutOptions,
  callback: (e: KeyboardEvent) => void,
) => {
  const {
    key,
    ctrlKey = false,
    altKey = false,
    shiftKey = false,
    metaKey = false,
    enabled = true,
    preventDefault = true,
  } = options;

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!enabled) return;

      const keyMatch = e.key.toLowerCase() === key.toLowerCase();
      const ctrlMatch = ctrlKey ? e.ctrlKey : !e.ctrlKey;
      const altMatch = altKey ? e.altKey : !e.altKey;
      const shiftMatch = shiftKey ? e.shiftKey : !e.shiftKey;
      const metaMatch = metaKey ? e.metaKey : !e.metaKey;

      if (keyMatch && ctrlMatch && altMatch && shiftMatch && metaMatch) {
        if (preventDefault) {
          e.preventDefault();
        }
        callback(e);
      }
    },
    [key, ctrlKey, altKey, shiftKey, metaKey, enabled, preventDefault, callback],
  );

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled, handleKeyDown]);
};
