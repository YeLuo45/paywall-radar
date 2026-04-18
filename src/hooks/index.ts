import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * Hook for intersection observer (lazy loading)
 */
export function useIntersectionObserver(
  callback: IntersectionObserverCallback,
  options?: IntersectionObserverInit
) {
  const [ref, setRef] = useState<Element | null>(null);

  useEffect(() => {
    if (!ref) return;
    const observer = new IntersectionObserver(callback, options);
    observer.observe(ref);
    return () => observer.disconnect();
  }, [ref, callback, options]);

  return setRef;
}

/**
 * Hook for debounced value
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Hook for local storage state
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      try {
        const valueToStore =
          value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);
        localStorage.setItem(key, JSON.stringify(valueToStore));
      } catch (error) {
        console.warn(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key, storedValue]
  );

  return [storedValue, setValue];
}

/**
 * Hook for previous value
 */
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
}

/**
 * Hook for window size
 */
export function useWindowSize() {
  const [size, setSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    const handleResize = () => {
      setSize({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return size;
}

/**
 * Hook for keyboard navigation
 */
export function useKeyboardNavigation(
  itemCount: number,
  onSelect: (index: number) => void,
  onNavigate?: (direction: 'up' | 'down' | 'left' | 'right') => void,
  enabled = true
) {
  const [focusedIndex, setFocusedIndex] = useState(-1);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusedIndex((prev) => Math.min(prev + 1, itemCount - 1));
        onNavigate?.('down');
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusedIndex((prev) => Math.max(prev - 1, 0));
        onNavigate?.('up');
      } else if (e.key === 'ArrowRight') {
        onNavigate?.('right');
      } else if (e.key === 'ArrowLeft') {
        onNavigate?.('left');
      } else if (e.key === 'Enter' && focusedIndex >= 0) {
        e.preventDefault();
        onSelect(focusedIndex);
      } else if (e.key === 'Escape') {
        setFocusedIndex(-1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled, itemCount, focusedIndex, onSelect, onNavigate]);

  return { focusedIndex, setFocusedIndex };
}

/**
 * Hook for async operation state
 */
export function useAsyncState<T>() {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(
    async (asyncFn: () => Promise<T>) => {
      setLoading(true);
      setError(null);
      try {
        const result = await asyncFn();
        setData(result);
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const reset = useCallback(() => {
    setData(null);
    setLoading(false);
    setError(null);
  }, []);

  return { data, loading, error, execute, reset };
}
