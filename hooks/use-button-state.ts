"use client";

import { useState, useCallback } from "react";

export interface ButtonState {
  loading: boolean;
  success: boolean;
  error: boolean;
}

export interface UseButtonStateReturn extends ButtonState {
  setLoading: () => void;
  setSuccess: (duration?: number) => void;
  setError: (duration?: number) => void;
  reset: () => void;
  execute: <T>(
    asyncFn: () => Promise<T>,
    options?: {
      successDuration?: number;
      errorDuration?: number;
      onSuccess?: (result: T) => void;
      onError?: (error: Error) => void;
    }
  ) => Promise<T | undefined>;
}

/**
 * Hook to manage button states (loading, success, error)
 * 
 * @example
 * const button = useButtonState();
 * 
 * // Manual control
 * button.setLoading();
 * button.setSuccess(2000); // Shows for 2 seconds
 * 
 * // Automatic control with async function
 * await button.execute(async () => {
 *   await api.submitForm(data);
 * }, {
 *   successDuration: 2000,
 *   onSuccess: () => router.push('/dashboard'),
 *   onError: (error) => toast.error(error.message)
 * });
 * 
 * // In JSX
 * <Button loading={button.loading} success={button.success}>
 *   Submit
 * </Button>
 */
export function useButtonState(): UseButtonStateReturn {
  const [state, setState] = useState<ButtonState>({
    loading: false,
    success: false,
    error: false,
  });

  const setLoading = useCallback(() => {
    setState({ loading: true, success: false, error: false });
  }, []);

  const setSuccess = useCallback((duration: number = 2000) => {
    setState({ loading: false, success: true, error: false });
    
    if (duration > 0) {
      setTimeout(() => {
        setState({ loading: false, success: false, error: false });
      }, duration);
    }
  }, []);

  const setError = useCallback((duration: number = 2000) => {
    setState({ loading: false, success: false, error: true });
    
    if (duration > 0) {
      setTimeout(() => {
        setState({ loading: false, success: false, error: false });
      }, duration);
    }
  }, []);

  const reset = useCallback(() => {
    setState({ loading: false, success: false, error: false });
  }, []);

  const execute = useCallback(
    async <T,>(
      asyncFn: () => Promise<T>,
      options?: {
        successDuration?: number;
        errorDuration?: number;
        onSuccess?: (result: T) => void;
        onError?: (error: Error) => void;
      }
    ): Promise<T | undefined> => {
      try {
        setLoading();
        const result = await asyncFn();
        setSuccess(options?.successDuration ?? 2000);
        options?.onSuccess?.(result);
        return result;
      } catch (error) {
        setError(options?.errorDuration ?? 2000);
        options?.onError?.(error as Error);
        return undefined;
      }
    },
    [setLoading, setSuccess, setError]
  );

  return {
    ...state,
    setLoading,
    setSuccess,
    setError,
    reset,
    execute,
  };
}


