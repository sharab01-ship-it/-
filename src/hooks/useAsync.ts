import { useState, useEffect, useCallback, useRef } from 'react';
import { ApiError } from '@/services/api';

interface AsyncState<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
}

export function useAsync<T>(
  asyncFn: () => Promise<T>,
  deps: React.DependencyList = [],
  options: { immediate?: boolean } = {}
) {
  const { immediate = true } = options;
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    isLoading: immediate,
    error: null,
  });

  const mountedRef = useRef(true);
  const requestIdRef = useRef(0);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const execute = useCallback(async () => {
    const currentRequestId = ++requestIdRef.current;
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const data = await asyncFn();
      if (mountedRef.current && currentRequestId === requestIdRef.current) {
        setState({ data, isLoading: false, error: null });
      }
      return data;
    } catch (err) {
      if (mountedRef.current && currentRequestId === requestIdRef.current) {
        const message = err instanceof ApiError ? err.message : 'حدث خطأ غير متوقع';
        setState({ data: null, isLoading: false, error: message });
      }
      throw err;
    }
  }, deps);

  useEffect(() => {
    if (immediate) {
      execute().catch(() => {});
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [immediate]);

  return {
    ...state,
    execute,
    setData: (data: T | null) => setState((prev) => ({ ...prev, data })),
    setError: (error: string | null) => setState((prev) => ({ ...prev, error })),
  };
}
