"use client";

import { useEffect, useState } from "react";

/** Ticks a mm:ss countdown down to zero; call `restart()` after a resend. */
export function useResendCountdown(initialSeconds = 60) {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setInterval(() => {
      setSecondsLeft((current) => Math.max(0, current - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [secondsLeft]);

  const restart = () => setSecondsLeft(initialSeconds);
  const label = `${String(Math.floor(secondsLeft / 60)).padStart(2, "0")}:${String(secondsLeft % 60).padStart(2, "0")}`;

  return { secondsLeft, label, canResend: secondsLeft === 0, restart };
}
