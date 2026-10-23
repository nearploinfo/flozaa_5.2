"use client";

interface PaystackTransactionOptions {
  key: string;
  email: string;
  amount: number;
  currency?: string;
  ref: string;
  metadata?: Record<string, unknown>;
  onSuccess: () => void;
  onCancel: () => void;
}

declare global {
  interface Window {
    PaystackPop?: new () => { newTransaction: (options: PaystackTransactionOptions) => void };
  }
}

const PAYSTACK_SCRIPT_SRC = "https://js.paystack.co/v2/inline.js";

export function usePaystackScript() {
  const loadPaystack = (): Promise<boolean> =>
    new Promise((resolve) => {
      if (window.PaystackPop) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = PAYSTACK_SCRIPT_SRC;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });

  return { loadPaystack };
}
