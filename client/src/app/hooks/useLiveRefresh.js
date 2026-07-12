import { useEffect, useRef } from "react";

const DEFAULT_INTERVAL_MS = 5000;

export const useLiveRefresh = (callback, options = {}) => {
  const { enabled = true, intervalMs = DEFAULT_INTERVAL_MS, deps = [] } = options;
  const callbackRef = useRef(callback);
  const enabledRef = useRef(enabled);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return undefined;

    const refresh = () => {
      if (!enabledRef.current || document.visibilityState === "hidden") return;
      callbackRef.current?.({ silent: true });
    };

    const intervalId = window.setInterval(refresh, intervalMs);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, intervalMs, ...deps]);
};

export default useLiveRefresh;
