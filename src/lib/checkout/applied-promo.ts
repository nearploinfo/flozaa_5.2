const STORAGE_PREFIX = "edemand_applied_promo_";

/** Which promo (by id) was last successfully applied to a cart — keyed the
 * same way checkout-draft.ts keys its slot draft, by cartId (or the
 * order/custom-job id standing in for one). Redux alone doesn't survive a
 * hard page reload, so without this a promo applied on /cart (or /checkout)
 * silently disappears the moment the tab refreshes, even though the server
 * would happily re-validate the same code again. */
export function setAppliedPromoId(cartId: number, promoCodeId: number): void {
  window.localStorage.setItem(`${STORAGE_PREFIX}${cartId}`, String(promoCodeId));
}

export function getAppliedPromoId(cartId: number): number | null {
  const raw = window.localStorage.getItem(`${STORAGE_PREFIX}${cartId}`);
  if (!raw) return null;
  const id = Number(raw);
  return Number.isFinite(id) ? id : null;
}

export function clearAppliedPromoId(cartId: number): void {
  window.localStorage.removeItem(`${STORAGE_PREFIX}${cartId}`);
}
