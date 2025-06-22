import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Hook para debounce de valores
 * @param value - Valor a ser debounced
 * @param delay - Delay em milissegundos
 * @returns Valor debounced
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * 🚀 HOOK OTIMIZADO PARA DEBOUNCE DE RANGES
 * Especialmente otimizado para filtros de área e valor que mudam frequentemente
 */
export function useRangeDebounce(
  value: [number, number],
  delay: number = 500
): [number, number] {
  const [debouncedValue, setDebouncedValue] = useState<[number, number]>(value);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // Cancelar timeout anterior
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // 🔧 CORREÇÃO: Sempre atualizar, mas com debounce
    timeoutRef.current = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * 🚀 HOOK PARA DEBOUNCE COM CANCELAMENTO MANUAL
 * Útil para casos onde queremos cancelar o debounce em certas situações
 */
export function useCancellableDebounce<T>(
  value: T,
  delay: number
): [T, () => void, () => void] {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  const flush = useCallback(() => {
    cancel();
    setDebouncedValue(value);
  }, [value, cancel]);

  useEffect(() => {
    cancel();

    timeoutRef.current = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return cancel;
  }, [value, delay, cancel]);

  return [debouncedValue, cancel, flush];
}
