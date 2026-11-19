import { useCallback, useEffect, useRef, useState } from 'react';
import { getErrorMessage } from '../api/axiosInstance';

interface RemoteState<T> {
  data: T | null;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
}

/**
 * Generic loader with loading, refreshing and error states. Re-runs when `deps` change.
 * Responses from superseded requests are ignored so a slow old request cannot overwrite
 * newer data. Failed refreshes keep the previous data and set `error`.
 */
export function useRemoteData<T>(
  fetcher: (force: boolean) => Promise<T>,
  deps: ReadonlyArray<unknown>,
  initial: T | null = null,
) {
  const [state, setState] = useState<RemoteState<T>>({
    data: initial,
    loading: initial === null,
    refreshing: false,
    error: null,
  });
  const latestFetcher = useRef(fetcher);
  latestFetcher.current = fetcher;
  const requestId = useRef(0);
  const initialRef = useRef(initial);

  const run = useCallback(async (mode: 'load' | 'refresh' | 'retry') => {
    const id = ++requestId.current;
    setState((prev) => {
      const data = mode === 'load' ? initialRef.current : prev.data;
      return { data, loading: mode !== 'refresh' && data === null, refreshing: mode === 'refresh', error: null };
    });
    try {
      const data = await latestFetcher.current(mode !== 'load');
      if (id === requestId.current) setState({ data, loading: false, refreshing: false, error: null });
    } catch (error) {
      if (id === requestId.current) {
        setState((prev) => ({ ...prev, loading: false, refreshing: false, error: getErrorMessage(error) }));
      }
    }
  }, []);

  useEffect(() => {
    run('load');
    return () => {
      requestId.current += 1;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return {
    ...state,
    refresh: useCallback(() => run('refresh'), [run]),
    retry: useCallback(() => run('retry'), [run]),
  };
}
