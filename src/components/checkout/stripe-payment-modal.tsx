"use client";

import { useMemo } from "react";
import type { FormEvent } from "react";
import { loadStripe, type Stripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, AddressElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { AppButton } from "@/components/ui/app-button";
import { CloseIcon } from "@/components/icons/icons";
import { useTranslation } from "@/lib/i18n/translation-context";

let stripePromise: Promise<Stripe | null> | null = null;

function getStripe(publishableKey: string): Promise<Stripe | null> {
  // Suppresses Stripe.js's test-mode "testing assistant" widget (the floating
  // dev-tools pill) — it's a debug aid meant for the integration's own
  // developers, not something a customer should see in a demo/storefront.
  if (!stripePromise) {
    stripePromise = loadStripe(publishableKey, {
      developerTools: { assistant: { enabled: false } },
    });
  }
  return stripePromise;
}

function StripeCheckoutForm({ onSuccess, onFailure }: { onSuccess: () => void; onFailure: () => void }) {
  const { t } = useTranslation();
  const stripe = useStripe();
  const elements = useElements();

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!stripe || !elements) return;

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
    });

    if (error) {
      onFailure();
      return;
    }
    if (paymentIntent?.status === "succeeded") {
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-4">
      <AddressElement options={{ mode: "billing" }} />
      <PaymentElement />
      <AppButton type="submit" variant="primary" size="lg" disabled={!stripe}>
        {t("checkoutPage.payment.stripeModal.pay")}
      </AppButton>
    </form>
  );
}

export function StripePaymentModal({
  open,
  clientSecret,
  publishableKey,
  onClose,
  onSuccess,
  onFailure,
}: {
  open: boolean;
  clientSecret: string | null;
  publishableKey: string;
  onClose: () => void;
  onSuccess: () => void;
  onFailure: () => void;
}) {
  const { t } = useTranslation();
  const stripe = useMemo(() => getStripe(publishableKey), [publishableKey]);

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="flex max-h-[85vh] w-full max-w-2xl flex-col gap-4 overflow-hidden rounded-xl bg-bg-primary p-6 sm:max-w-2xl"
      >
        <div className="flex w-full shrink-0 items-center justify-between">
          <DialogTitle className="text-lg font-medium text-text-primary">
            {t("checkoutPage.payment.stripeModal.title")}
          </DialogTitle>
          <button type="button" onClick={onClose} aria-label={t("checkoutPage.dateTime.modal.closeAriaLabel")}>
            <CloseIcon className="size-4" />
          </button>
        </div>
        <div className="flex-1 overflow-x-hidden overflow-y-auto">
          {clientSecret && (
            <Elements stripe={stripe} options={{ clientSecret, appearance: { theme: "stripe" } }}>
              <StripeCheckoutForm onSuccess={onSuccess} onFailure={onFailure} />
            </Elements>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
