import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';

/** Update in-page controls without losing the fragment or the learner's route state. */
export function useContextSearchParams() {
  const location = useLocation();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  function setParams(update: (previous: URLSearchParams) => URLSearchParams) {
    const next = update(new URLSearchParams(params)).toString();
    void navigate({
      pathname: location.pathname,
      search: next ? `?${next}` : '',
      hash: location.hash,
    }, { replace: true, preventScrollReset: true, state: location.state });
  }

  return [params, setParams] as const;
}
