import React, { useRef, useEffect, useCallback } from "react";

export default function useTimeout(
  callback: React.EffectCallback,
  delay: number
) {
  const callbackRef = useRef(callback);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const set = useCallback(() => {
    timeoutRef.current = setTimeout(() => callbackRef.current(), delay);
  }, [delay]);

  const clear = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, []);

  useEffect(() => {
    set();
    return clear;
  }, [clear, set]);

  const restart = useCallback(() => {
    clear();
    set();
  }, [clear, set]);

  return { restart, clear };
}
