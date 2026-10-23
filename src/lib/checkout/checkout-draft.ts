const STORAGE_PREFIX = "edemand_checkout_draft_";

interface CheckoutDraft {
  date: string;
  time: string;
}

export function setCheckoutDraft(cartId: number, date: string, time: string): void {
  const payload: CheckoutDraft = { date, time };
  window.localStorage.setItem(`${STORAGE_PREFIX}${cartId}`, JSON.stringify(payload));
}

export function getCheckoutDraft(cartId: number): CheckoutDraft | null {
  const raw = window.localStorage.getItem(`${STORAGE_PREFIX}${cartId}`);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as CheckoutDraft;
  } catch {
    return null;
  }
}

export function clearCheckoutDraft(cartId: number): void {
  window.localStorage.removeItem(`${STORAGE_PREFIX}${cartId}`);
}
