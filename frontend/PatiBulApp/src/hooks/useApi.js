import { useState, useCallback, useRef } from 'react';
import { apiFetch, ApiError, ERROR_TYPES } from '../services/api';

export default function useApi() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const lastCall = useRef(null);

  const execute = useCallback(async (endpoint, options = {}) => {
    setLoading(true);
    setError(null);

    lastCall.current = { endpoint, options };

    try {
      const result = await apiFetch(endpoint, options);
      setData(result.data);
      return result.data;
    } catch (err) {
      if (err instanceof ApiError) {
        setError({
          type: err.type,
          message: err.message,
          status: err.status,
          data: err.data,
        });
      } else {
        setError({
          type: ERROR_TYPES.UNKNOWN,
          message: err.message || 'Bilinmeyen bir hata oluştu.',
          status: null,
        });
      }
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const retry = useCallback(() => {
    if (lastCall.current) {
      execute(lastCall.current.endpoint, lastCall.current.options);
    }
  }, [execute]);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return {
    data,
    loading,
    error,
    execute,
    retry,
    reset,
    setData,
  };
}
