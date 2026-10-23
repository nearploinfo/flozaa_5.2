import { useEffect } from "react";

/** Locks page scroll while `locked` is true. Only needed for dialogs that
 * pass `modal={false}` to Radix's Dialog.Root (see signin-modal/signup-modal
 * — required there so the reCAPTCHA challenge iframe stays clickable), since
 * that also opts out of Radix's own scroll lock as a side effect. */
export function useScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [locked]);
}
