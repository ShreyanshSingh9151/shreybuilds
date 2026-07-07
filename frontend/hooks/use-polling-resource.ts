"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ResourceState } from "@/lib/types";

type Options<T> = {
  fetcher: () => Promise<T>;
  fallback: () => Promise<T>;
  interval?: number;
  initialData: T;
};

export function usePollingResource<T>({ fetcher, fallback, interval = 8000, initialData }: Options<T>): ResourceState<T> {
  const [data, setData] = useState<T>(initialData);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<"api" | "mock">("api");
  const mountedRef = useRef(true);
  const hasLoadedApiRef = useRef(false);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const load = useCallback(async (background = false) => {
    if (background) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const result = await fetcher();
      if (!mountedRef.current) return;
      setData(result);
      setSource("api");
      setError(null);
      hasLoadedApiRef.current = true;
    } catch (err) {
      if (hasLoadedApiRef.current) {
        if (!mountedRef.current) return;
        setError(err instanceof Error ? err.message : "Backend unavailable");
      } else {
        const fallbackData = await fallback();
        if (!mountedRef.current) return;
        setData(fallbackData);
        setSource("mock");
        setError(err instanceof Error ? err.message : "Backend unavailable");
      }
    } finally {
      if (!mountedRef.current) return;
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [fallback, fetcher]);

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => {
      void load(true);
    }, interval);

    return () => window.clearInterval(timer);
  }, [interval, load]);

  return useMemo(
    () => ({
      data,
      isLoading,
      isRefreshing,
      error,
      source,
      refetch: async () => load(true)
    }),
    [data, error, isLoading, isRefreshing, load, source]
  );
}
