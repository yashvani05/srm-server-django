import { useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

/**
 * Returns a "go back" handler for Cancel buttons: returns to the page the user came from, and only falls back to
 * `fallback` when the page was opened directly (a new tab, a pasted link or a refresh), where there is nothing to go back to.
 */
export function useGoBack(fallback: string) {
  const navigate = useNavigate();
  const location = useLocation();

  return useCallback(() => {
    // react-router gives the first entry of a session the key "default".
    if (location.key !== 'default') navigate(-1);
    else navigate(fallback, { replace: true });
  }, [navigate, location.key, fallback]);
}
