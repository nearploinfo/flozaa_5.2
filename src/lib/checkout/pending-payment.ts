const STORAGE_KEY = "edemand_pending_payment";

interface PendingPayment {
  orderId: string;
  method: string;
  ts: number;
}

export function setPendingPayment(orderId: string | number, method: string): void {
  const payload: PendingPayment = { orderId: String(orderId), method, ts: Date.now() };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

export function getPendingPayment(): PendingPayment | null {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PendingPayment;
  } catch {
    return null;
  }
}

export function clearPendingPayment(): void {
  window.localStorage.removeItem(STORAGE_KEY);
}
