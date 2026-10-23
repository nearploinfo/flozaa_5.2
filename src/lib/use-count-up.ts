"use client";

import { useEffect, useRef, useState } from "react";

const DURATION_MS = 1200;

export function useCountUp(target: number, decimals: number, shouldStart: boolean): number {
  const [value, setValue] = useState(0);
  const hasStartedRef = useRef(false);

  useEffect(() => {
    if (!shouldStart || hasStartedRef.current) return;
    hasStartedRef.current = true;

    let rafId: number;
    const startTime = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / DURATION_MS, 1);
      const factor = Number((target * progress).toFixed(decimals));
      setValue(factor);
      if (progress < 1) {
        rafId = requestAnimationFrame(tick);
      }
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [shouldStart, target, decimals]);

  return value;
}
