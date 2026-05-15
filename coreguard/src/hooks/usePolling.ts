'use client';
import { useState, useEffect, useRef, useCallback } from 'react';

export function usePolling(
  callback: () => void | Promise<void>,
  intervalMs: number,
  enabled = true,
) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  const [isPolling, setIsPolling] = useState(false);

  const poll = useCallback(async () => {
    setIsPolling(true);
    await callbackRef.current();
    setIsPolling(false);
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const id = setInterval(() => {
      callbackRef.current();
    }, intervalMs);

    return () => clearInterval(id);
  }, [intervalMs, enabled]);

  return { poll, isPolling };
}