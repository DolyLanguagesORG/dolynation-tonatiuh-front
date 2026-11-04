"use client";

import { useCallback, useState } from "react";

import { ApiClientError, type ApiResponse, ErrorCode } from "@/lib/api-errors";

export interface UseApiRequestReturn<T, Args extends unknown[]> {
  data: T | null;
  error: ApiClientError | null;
  isLoading: boolean;
  execute: (...args: Args) => Promise<ApiResponse<T> | null>;
  reset: () => void;
}

/**
 * Hook reutilizable para ejecutar llamadas al cliente HTTP con estado reactivo
 * de carga y normalización uniforme de errores `ApiClientError`.
 */
export function useApiRequest<T, Args extends unknown[] = []>(
  requestFn: (...args: Args) => Promise<ApiResponse<T>>,
): UseApiRequestReturn<T, Args> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<ApiClientError | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const execute = useCallback(
    async (...args: Args): Promise<ApiResponse<T> | null> => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await requestFn(...args);
        setData(response.data);
        return response;
      } catch (err) {
        const normalized =
          err instanceof ApiClientError
            ? err
            : new ApiClientError({
                code: ErrorCode.UNKNOWN_ERROR,
                status: 0,
              });
        setError(normalized);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [requestFn],
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return { data, error, isLoading, execute, reset };
}
