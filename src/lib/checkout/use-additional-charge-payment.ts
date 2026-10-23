"use client";

import { useState } from "react";
import { useRouter } from "next/router";
import { toast } from "sonner";
import {
  addTransactionApi,
  createCashfreeOrderApi,
  createRazorOrderApi,
  stripePaymentIntentApi,
} from "@/api/apiRoutes";
import type { CheckoutPaymentMethod } from "@/lib/checkout/checkout-types";
import { extractErrorMessage } from "@/lib/checkout/checkout-types";
import { useTranslation } from "@/lib/i18n/translation-context";
import { localizePath } from "@/lib/i18n/locale-path";
import { useRazorpayScript } from "@/lib/checkout/use-razorpay-script";
import { usePaystackScript } from "@/lib/checkout/use-paystack-script";
import { usePaymentGatewaySettings } from "@/lib/checkout/use-payment-gateway-settings";
import { useAppSelector } from "@/store/hooks";

/** Parallel to use-checkout-flow.ts's gateway handlers, but for paying a
 * charge a provider already added to an existing (bookingEnded) order —
 * there's no cart/placeOrderApi step, everything is keyed off `orderId`.
 * Finishes the same way checkout does: redirect to /payment-status. */
export function useAdditionalChargePayment({
  orderId,
  amount,
}: {
  orderId: number;
  amount: number;
}) {
  const { t, lang, defaultLocale } = useTranslation();
  const router = useRouter();
  const { loadRazorpay } = useRazorpayScript();
  const { loadPaystack } = usePaystackScript();
  const gatewaySettings = usePaymentGatewaySettings();
  const userEmail = useAppSelector((state) => state.auth.user?.email);

  const [isProcessing, setIsProcessing] = useState(false);
  const [stripeModal, setStripeModal] = useState<{
    open: boolean;
    clientSecret: string | null;
    transactionId: number | null;
  }>({ open: false, clientSecret: null, transactionId: null });

  const goToPaymentStatus = (method: CheckoutPaymentMethod, status: "successful" | "failed") =>
    router.push(
      localizePath("/payment-status", lang, defaultLocale) +
        `?order_id=${orderId}&status=${status}&method=${method}`
    );

  const registerPendingTransaction = (paymentMethod: CheckoutPaymentMethod) =>
    addTransactionApi({
      order_id: orderId,
      status: "pending",
      is_additional_charge: 1,
      payment_method: paymentMethod,
    });

  const handleCodPayment = async () => {
    const transaction = await registerPendingTransaction("cod");
    if (transaction?.error) throw new Error(transaction?.message);
    await goToPaymentStatus("cod", "successful");
  };

  const handleRazorpayPayment = async () => {
    const scriptLoaded = await loadRazorpay();
    if (!scriptLoaded || !window.Razorpay) {
      throw new Error(t("checkoutPage.errors.orderFailed"));
    }
    const transaction = await registerPendingTransaction("razorpay");
    if (transaction?.error) throw new Error(transaction?.message);
    const transactionId = transaction?.data?.id;

    const razorOrder = await createRazorOrderApi({ order_id: orderId, is_additional_charge: 1 });
    if (razorOrder?.error) throw new Error(razorOrder?.message);

    return new Promise<void>((resolve) => {
      let settled = false;
      const options = {
        key: gatewaySettings.razorpay_key,
        amount: razorOrder?.data?.amount,
        currency: gatewaySettings.razorpay_currency,
        order_id: razorOrder?.data?.id,
        notes: { order_id: orderId, additional_charges_transaction_id: transactionId },
        handler: async (response: { razorpay_payment_id?: string }) => {
          if (!response.razorpay_payment_id) {
            resolve();
            return;
          }
          settled = true;
          await addTransactionApi({
            order_id: orderId,
            status: "success",
            is_additional_charge: 1,
            payment_method: "razorpay",
            transaction_id: transactionId,
          });
          await goToPaymentStatus("razorpay", "successful");
          resolve();
        },
        modal: {
          ondismiss: async () => {
            if (settled) return;
            await addTransactionApi({
              order_id: orderId,
              status: "cancelled",
              is_additional_charge: 1,
              payment_method: "razorpay",
              transaction_id: transactionId,
            });
            await goToPaymentStatus("razorpay", "failed");
            resolve();
          },
        },
      };
      new window.Razorpay!(options).open();
    });
  };

  const handlePaystackPayment = async () => {
    if (!userEmail) throw new Error(t("checkoutPage.errors.paystackEmailRequired"));
    const scriptLoaded = await loadPaystack();
    if (!scriptLoaded || !window.PaystackPop) {
      throw new Error(t("checkoutPage.errors.orderFailed"));
    }
    const transaction = await registerPendingTransaction("paystack");
    if (transaction?.error) throw new Error(transaction?.message);
    const transactionId = transaction?.data?.id;

    return new Promise<void>((resolve) => {
      let settled = false;
      new window.PaystackPop!().newTransaction({
        key: gatewaySettings.paystack_key ?? "",
        email: userEmail,
        amount: Math.round(amount * 100),
        currency: gatewaySettings.paystack_currency,
        ref: `order_${orderId}_${Date.now()}`,
        metadata: { order_id: orderId, additional_charges_transaction_id: transactionId },
        onSuccess: async () => {
          settled = true;
          await addTransactionApi({
            order_id: orderId,
            status: "success",
            is_additional_charge: 1,
            payment_method: "paystack",
            transaction_id: transactionId,
          });
          await goToPaymentStatus("paystack", "successful");
          resolve();
        },
        onCancel: async () => {
          if (settled) return;
          await addTransactionApi({
            order_id: orderId,
            status: "cancelled",
            is_additional_charge: 1,
            payment_method: "paystack",
            transaction_id: transactionId,
          });
          await goToPaymentStatus("paystack", "failed");
          resolve();
        },
      });
    });
  };

  const handleCashfreePayment = async () => {
    const transaction = await registerPendingTransaction("cashfree");
    if (transaction?.error) throw new Error(transaction?.message);

    const cashfreeOrder = await createCashfreeOrderApi({ order_id: orderId, is_additional_charge: 1 });
    if (cashfreeOrder?.error) throw new Error(cashfreeOrder?.message);
    const sessionId = cashfreeOrder?.data?.payment_session_id;
    if (!sessionId) throw new Error(t("checkoutPage.errors.gatewayUrlMissing"));

    const { load } = await import("@cashfreepayments/cashfree-js");
    const cashfree = await load({
      mode: gatewaySettings.cashfree_mode === "production" ? "production" : "sandbox",
    });
    // Cashfree's own hosted checkout redirects back to the return URL
    // configured server-side for this order — same as checkout's flow.
    cashfree.checkout({ paymentSessionId: sessionId, redirectTarget: "_self" });
  };

  const handleRedirectPayment = async (method: "paypal" | "flutterwave" | "xendit", linkKey: string) => {
    const transaction = await registerPendingTransaction(method);
    if (transaction?.error) throw new Error(transaction?.message);
    const redirectUrl = transaction?.data?.[linkKey];
    if (!redirectUrl) throw new Error(t("checkoutPage.errors.gatewayUrlMissing"));
    // These gateways redirect back to /payment-status themselves via the
    // return URL configured server-side for this order.
    window.location.href = redirectUrl;
  };

  const handlePaypalPayment = () => handleRedirectPayment("paypal", "paypal_link");
  const handleFlutterwavePayment = () => handleRedirectPayment("flutterwave", "flutterwave_link");
  const handleXenditPayment = () => handleRedirectPayment("xendit", "xendit_link");

  const handleStripePayment = async () => {
    const transaction = await registerPendingTransaction("stripe");
    if (transaction?.error) throw new Error(transaction?.message);
    const transactionId = transaction?.data?.id;

    const intent = await stripePaymentIntentApi({ transaction_id: transactionId, is_additional_charge: 1 });
    if (intent?.error) throw new Error(intent?.message);

    setStripeModal({ open: true, clientSecret: intent?.data?.client_secret ?? null, transactionId });
  };

  const handleStripeModalSuccess = async () => {
    if (!stripeModal.transactionId) return;
    await addTransactionApi({
      order_id: orderId,
      status: "success",
      is_additional_charge: 1,
      payment_method: "stripe",
      transaction_id: stripeModal.transactionId,
    });
    setStripeModal({ open: false, clientSecret: null, transactionId: null });
    await goToPaymentStatus("stripe", "successful");
  };

  const handleStripeModalFailure = async () => {
    if (!stripeModal.transactionId) return;
    await addTransactionApi({
      order_id: orderId,
      status: "failed",
      is_additional_charge: 1,
      payment_method: "stripe",
      transaction_id: stripeModal.transactionId,
    });
    setStripeModal({ open: false, clientSecret: null, transactionId: null });
    await goToPaymentStatus("stripe", "failed");
  };

  const closeStripeModal = () => setStripeModal({ open: false, clientSecret: null, transactionId: null });

  const pay = async (method: CheckoutPaymentMethod) => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      if (method === "cod") {
        await handleCodPayment();
      } else if (method === "razorpay") {
        await handleRazorpayPayment();
      } else if (method === "paystack") {
        await handlePaystackPayment();
      } else if (method === "cashfree") {
        await handleCashfreePayment();
      } else if (method === "paypal") {
        await handlePaypalPayment();
      } else if (method === "flutterwave") {
        await handleFlutterwavePayment();
      } else if (method === "xendit") {
        await handleXenditPayment();
      } else if (method === "stripe") {
        await handleStripePayment();
      }
    } catch (error) {
      toast.error(extractErrorMessage(error, t("checkoutPage.errors.orderFailed")));
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    pay,
    isProcessing,
    stripeModal: { open: stripeModal.open, clientSecret: stripeModal.clientSecret },
    closeStripeModal,
    handleStripeModalSuccess,
    handleStripeModalFailure,
  };
}
