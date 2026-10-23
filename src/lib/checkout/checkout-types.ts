export type DeliveryAddressType = "doorstep" | "store";

export type CheckoutPaymentMethod =
  | "cod"
  | "stripe"
  | "razorpay"
  | "xendit"
  | "cashfree"
  | "paypal"
  | "paystack"
  | "flutterwave";

export interface PaymentGatewaySettings {
  stripe_status?: string;
  stripe_publishable_key?: string;
  razorpayApiStatus?: string;
  razorpay_key?: string;
  razorpay_currency?: string;
  xendit_status?: string;
  cashfree_status?: string;
  cashfree_mode?: "production" | "sandbox";
  cod_setting?: string;
  paypal_status?: string;
  paystack_status?: string;
  paystack_key?: string;
  paystack_currency?: string;
  flutterwave_status?: string;
}

/**
 * API errors surface three shapes in this codebase: an Error thrown by
 * postApi's catch-and-rethrow (has .message), an axios error with a
 * response body ({error: true, message}), or a raw string. Normalize all
 * three to a single user-facing string, falling back when none apply.
 */
export function extractErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "string" && error) return error;
  if (
    error &&
    typeof error === "object" &&
    "response" in error &&
    error.response &&
    typeof error.response === "object" &&
    "data" in error.response &&
    error.response.data &&
    typeof error.response.data === "object" &&
    "message" in error.response.data &&
    typeof error.response.data.message === "string" &&
    error.response.data.message
  ) {
    return error.response.data.message;
  }
  return fallback;
}
