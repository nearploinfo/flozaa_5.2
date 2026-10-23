// In-page payment gateways (Paystack, Razorpay, Stripe) keep the checkout
// page mounted while their modal is open — the order is already placed, so
// if a cart refetch elsewhere makes the cart group for this cartId disappear
// mid-modal, checkout-view.tsx's "cart not found -> redirect to /cart" guard
// would tear the page down before onSuccess/onCancel can route to
// payment-status. This flag lets that guard skip while a modal is up.
let inFlight = false;

export function setPaymentInFlight(value: boolean): void {
  inFlight = value;
}

export function isPaymentInFlight(): boolean {
  return inFlight;
}
