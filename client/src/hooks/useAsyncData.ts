import { useCallback, useEffect, useRef, useState } from 'react';
import type { ApiError } from '../services/api/ApiError';

const MIN_FIRST_LOAD_MS = 450;

interface State<T> {
  data: T | null;
  error: ApiError | null;
  isFetching: boolean;
}

export function useAsyncData<T>(fetcher: (signal: AbortSignal) => Promise<T>, deps: readonly unknown[]) {
  const [state, setState] = useState<State<T>>({ data: null, error: null, isFetching: true });
  const [reloadKey, setReloadKey] = useState(0);
  const hasLoaded = useRef(false);

  useEffect(() => {
    const controller = new AbortController();
    setState((s) => ({ ...s, error: null, isFetching: true }));

    const startedAt = Date.now();
    fetcher(controller.signal)
      .then(async (data) => {
        const wait = hasLoaded.current ? 0 : MIN_FIRST_LOAD_MS - (Date.now() - startedAt);
        if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
        if (controller.signal.aborted) return;
        hasLoaded.current = true;
        setState({ data, error: null, isFetching: false });
      })
      .catch((err: ApiError) => {
        if (controller.signal.aborted) return;
        setState((s) => ({ ...s, error: err, isFetching: false }));
      });

    return () => controller.abort();
  }, [...deps, reloadKey]);

  const reload = useCallback(() => setReloadKey((k) => k + 1), []);
  const setData = useCallback((data: T) => setState((s) => ({ ...s, data })), []);

  return {
    data: state.data,
    error: state.error,
    isLoading: state.data === null && state.error === null,
    isFetching: state.isFetching,
    reload,
    setData,
  };
}
