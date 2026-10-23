"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";

function ProgressBar() {
  const router = useRouter();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const trickleRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    function handleStart() {
      if (trickleRef.current) clearInterval(trickleRef.current);
      setVisible(true);
      setProgress(10);
      trickleRef.current = setInterval(() => {
        setProgress((p) => (p < 85 ? p + (85 - p) * 0.1 : p));
      }, 200);
    }

    function handleDone() {
      if (trickleRef.current) clearInterval(trickleRef.current);
      setProgress(100);
      setTimeout(() => {
        setVisible(false);
        setProgress(0);
      }, 200);
    }

    router.events.on("routeChangeStart", handleStart);
    router.events.on("routeChangeComplete", handleDone);
    router.events.on("routeChangeError", handleDone);
    return () => {
      router.events.off("routeChangeStart", handleStart);
      router.events.off("routeChangeComplete", handleDone);
      router.events.off("routeChangeError", handleDone);
      if (trickleRef.current) clearInterval(trickleRef.current);
    };
  }, [router.events]);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-x-0 top-0 z-1100 h-1 bg-transparent"
      aria-hidden
    >
      <div
        className="h-full bg-primary transition-all duration-200 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

export function TopProgressBar() {
  return (
    <Suspense fallback={null}>
      <ProgressBar />
    </Suspense>
  );
}
