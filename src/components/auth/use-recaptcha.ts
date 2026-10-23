"use client";

import { useRef } from "react";
import type { RecaptchaVerifier } from "firebase/auth";
import { createRecaptchaVerifier } from "@/lib/firebase";

/** Lazily creates (and reuses) an invisible reCAPTCHA verifier bound to `containerId`. */
export function useRecaptcha(containerId: string) {
  const verifierRef = useRef<RecaptchaVerifier | null>(null);

  const getVerifier = (): RecaptchaVerifier => {
    if (!verifierRef.current) {
      verifierRef.current = createRecaptchaVerifier(containerId);
    }
    return verifierRef.current;
  };

  const clearRecaptcha = () => {
    verifierRef.current?.clear();
    verifierRef.current = null;
  };

  return { getVerifier, clearRecaptcha };
}
