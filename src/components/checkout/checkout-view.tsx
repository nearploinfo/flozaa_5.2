"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { PageBreadcrumb } from "@/components/layout/page-breadcrumb";
import { ArrowLeftIcon, SwitchProviderIcon } from "@/components/icons/icons";
import { DateTimeSection } from "@/components/checkout/date-time-section";
import { LocationSection } from "@/components/checkout/location-section";
import { PaymentMethodSection } from "@/components/checkout/payment-method-section";
import { MobileItemsSection } from "@/components/checkout/mobile-items-section";
import { MobileOffersSection } from "@/components/checkout/mobile-offers-section";
import { MobileBillDetailsSection } from "@/components/checkout/mobile-bill-details-section";
import { MobilePaymentBar } from "@/components/checkout/mobile-payment-bar";
import { CheckoutOrderSummary } from "@/components/checkout/checkout-order-summary";
import { BillingAddressSection } from "@/components/checkout/billing-address-section";
import { CheckoutSkeleton } from "@/components/checkout/checkout-skeleton";
import { StripePaymentModal } from "@/components/checkout/stripe-payment-modal";
import { CartSheet } from "@/components/cart/cart-sheet";
import { useTranslation } from "@/lib/i18n/translation-context";
import { localizePath } from "@/lib/i18n/locale-path";
import { useCart } from "@/lib/use-cart";
import { useCheckoutFlow } from "@/lib/checkout/use-checkout-flow";
import { isPaymentInFlight } from "@/lib/checkout/payment-in-flight";
import { usePaymentGatewaySettings } from "@/lib/checkout/use-payment-gateway-settings";
import { useAppSelector } from "@/store/hooks";
import { haversineDistanceKm } from "@/lib/helpers";
import { useShowPrice } from "@/lib/show-price";
import type { CartGroup } from "@/lib/cart-types";

export function CheckoutView() {
  const { t, lang, defaultLocale } = useTranslation();
  const router = useRouter();
  const { data, status, loggedIn } = useCart();
  const customJobData = useAppSelector((state) => state.customJob.data);
  const reorderState = useAppSelector((state) => state.reorder);

  const cartIdParam = router.query.cartId;
  const cartId = typeof cartIdParam === "string" ? Number(cartIdParam) : NaN;
  const customJobRequestIdParam = router.query.customJobRequestId;
  const isCustomJobRoute = typeof customJobRequestIdParam === "string";
  const reorderOrderIdParam = router.query.reorderOrderId;
  const isReorderRoute = typeof reorderOrderIdParam === "string";

  // Custom-job checkout has no real cart entry — it's a single accepted bid,
  // shimmed into the same CartGroup shape so the rest of checkout (date/time,
  // location, payment) runs unmodified. Bid data lives in redux (set when the
  // user clicked "Book Provider"), the URL only carries the request id.
  const customJobCartGroup: CartGroup | null = useMemo(
    () =>
      isCustomJobRoute && customJobData && String(customJobData.customJobRequestId) === customJobRequestIdParam
        ? {
            cartId: customJobData.customJobRequestId,
            providerId: customJobData.bidderId,
            companyName: customJobData.companyName,
            providerImage: customJobData.providerImage,
            isProviderVerified: false,
            totalQuantity: 1,
            subTotal: customJobData.counterPrice,
            subTotalWithoutTax: customJobData.counterPrice,
            overallAmount: customJobData.counterPrice,
            atDoorstep: customJobData.atDoorstep,
            atStore: customJobData.atStore,
            providerLatitude: customJobData.providerLatitude,
            providerLongitude: customJobData.providerLongitude,
            // is_pay_later_allowed/is_online_payment_allowed still don't exist
            // on the bid/provider API — default to both allowed so the
            // checkout is always completable pending real data from backend.
            isPayLaterAllowed: true,
            isOnlinePaymentAllowed: true,
            items: [
              {
                serviceId: 0,
                serviceTitle: customJobData.serviceTitle ?? customJobData.companyName,
                price: customJobData.counterPrice,
                qty: 1,
                ...(customJobData.duration ? { durationType: customJobData.duration } : {}),
              },
            ],
          }
        : null,
    [isCustomJobRoute, customJobData, customJobRequestIdParam]
  );

  // Reorder checkout has no real cart entry either — the "Book Again" trigger
  // already normalized the order's reorder_data into a full CartGroup and
  // stashed it in redux right before navigating here; the URL only carries
  // the order id so a refresh can at least tell reorder mode was intended.
  const reorderCartGroup: CartGroup | null =
    isReorderRoute && reorderState.cartGroup && String(reorderState.orderId) === reorderOrderIdParam
      ? reorderState.cartGroup
      : null;

  const cartGroup = useMemo(
    () => customJobCartGroup ?? reorderCartGroup ?? data?.carts.find((group) => group.cartId === cartId),
    [customJobCartGroup, reorderCartGroup, data, cartId]
  );

  const cartResolved = isCustomJobRoute || isReorderRoute || status === "loaded" || status === "error";

  useEffect(() => {
    if (!loggedIn || !cartResolved) return;
    if (isCustomJobRoute) {
      if (!customJobCartGroup) router.replace(localizePath("/my-services-requests", lang, defaultLocale));
      return;
    }
    if (isReorderRoute) {
      if (!reorderCartGroup) router.replace(localizePath(`/booking/${reorderOrderIdParam}`, lang, defaultLocale));
      return;
    }
    if ((!Number.isFinite(cartId) || !cartGroup) && !isPaymentInFlight()) {
      router.replace(localizePath("/cart", lang, defaultLocale));
    }
  }, [
    loggedIn,
    cartResolved,
    cartId,
    cartGroup,
    isCustomJobRoute,
    customJobCartGroup,
    isReorderRoute,
    reorderCartGroup,
    reorderOrderIdParam,
    router,
    lang,
    defaultLocale,
  ]);

  if (!cartGroup) {
    return (
      <>
        <div className="hidden xl:block">
          <PageBreadcrumb title={t("checkoutPage.title")} items={[{ label: t("checkoutPage.title") }]} />
        </div>
        <CheckoutSkeleton />
      </>
    );
  }

  return (
    <CheckoutViewForCart
      cartGroup={cartGroup}
      customJob={isCustomJobRoute ? { requestId: cartGroup.cartId, bidderId: cartGroup.providerId } : undefined}
      reorder={isReorderRoute ? { orderId: cartGroup.cartId } : undefined}
    />
  );
}

function CheckoutViewForCart({
  cartGroup,
  customJob,
  reorder,
}: {
  cartGroup: CartGroup;
  customJob?: { requestId: number; bidderId: number };
  reorder?: { orderId: number };
}) {
  const { t, lang, defaultLocale } = useTranslation();
  const router = useRouter();
  const { data } = useCart();
  const flow = useCheckoutFlow(cartGroup, customJob, reorder);
  // Totals, fees and tax all come from the re-priced cart (get_cart with the
  // selected address + promo) — the redux group only carries the unpriced
  // figures, which no longer match what place_order charges.
  const pricedGroup = flow.pricedCartGroup;
  const gatewaySettings = usePaymentGatewaySettings();
  const userLat = useAppSelector((state) => state.location.lat);
  const userLng = useAppSelector((state) => state.location.lng);
  const groupPrice = useShowPrice(cartGroup.subTotal);
  const [cartSheetOpen, setCartSheetOpen] = useState(false);


  // One provider in cart: jump straight to its detail page via provider_slug
  // (falls back to this page's own picker sheet if a cart group somehow
  // lacks it). More than one: there's an actual choice to make, so send the
  // user back to home and open the picker there instead of stacking a
  // second sheet on top of checkout.
  const handleSwitchProvider = () => {
    const carts = data?.carts ?? [];
    if (carts.length === 1) {
      if (cartGroup.providerSlug) {
        router.push(localizePath(`/provider-details/${cartGroup.providerSlug}`, lang, defaultLocale));
      } else {
        setCartSheetOpen(true);
      }
      return;
    }
    router.push(localizePath("/?openCartSheet=1", lang, defaultLocale));
  };

  const storeDistanceKm =
    cartGroup.distance ??
    (userLat != null &&
    userLng != null &&
    cartGroup.providerLatitude != null &&
    cartGroup.providerLongitude != null
      ? haversineDistanceKm(userLat, userLng, cartGroup.providerLatitude, cartGroup.providerLongitude)
      : null);

  return (
    <>
      <div className="hidden xl:block">
        <PageBreadcrumb title={t("checkoutPage.title")} items={[{ label: t("checkoutPage.title") }]} />
      </div>

      <div className="flex w-full items-center gap-2 border-b border-border-default bg-bg-primary p-4 xl:hidden">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex items-center justify-center rounded-3xl p-2"
          aria-label={t("checkoutPage.back")}
        >
          <ArrowLeftIcon className="size-6 text-icon-primary rtl:rotate-180" />
        </button>
        <div className="flex flex-1 flex-col items-start gap-1">
          <span className="text-base font-bold text-text-primary">{cartGroup.companyName}</span>
          <div className="flex items-center gap-2 text-xs text-text-secondary">
            <span>{t("common.servicesCount", { count: cartGroup.totalQuantity })}</span>
            <span className="size-1 rounded-full bg-icon-tertiary" />
            <span>{groupPrice}</span>
          </div>
        </div>
        <button
          type="button"
          onClick={handleSwitchProvider}
          className="flex items-center justify-center rounded-3xl p-2"
          aria-label={t("checkoutPage.switchProvider")}
        >
          <SwitchProviderIcon className="size-6 text-icon-primary" />
        </button>
      </div>

      <CartSheet open={cartSheetOpen} onOpenChange={setCartSheetOpen} />

      <div className="flex w-full justify-center bg-bg-secondary pb-28 xl:py-16">
        <div className="flex w-full flex-col items-start gap-6 xl:container xl:grid xl:grid-cols-12 xl:items-start">
          <div className="flex w-full flex-col items-start gap-6 xl:col-span-8">
            <div className="order-4 w-full px-4 xl:order-1 xl:px-0">
              <DateTimeSection
                providerId={cartGroup.providerId}
                advanceBookingDays={cartGroup.advanceBookingDays}
                selectedDate={flow.selectedDate}
                selectedTime={flow.selectedTime}
                slotMessage={flow.slotMessage}
                lockStatus={flow.slotLockStatus}
                lockError={flow.slotLockError}
                onConfirm={flow.confirmSlot}
              />
            </div>
            <div className="order-1 w-full xl:order-2">
              <LocationSection
                canUseDoorstep={Boolean(cartGroup.atDoorstep)}
                canUseStore={Boolean(cartGroup.atStore)}
                deliveryAddressType={flow.deliveryAddressType}
                onDeliveryAddressTypeChange={flow.setDeliveryAddressType}
                addresses={flow.addresses}
                addressesStatus={flow.addressesStatus}
                selectedAddressId={flow.selectedAddressId}
                onSelectAddress={flow.selectAddress}
                deliveryNote={flow.deliveryNote}
                onDeliveryNoteChange={flow.setDeliveryNote}
                onAddressesChanged={flow.reloadAddresses}
                providerAvailabilityStatus={flow.providerAvailabilityStatus}
                providerDistanceKm={
                  flow.deliveryAddressType === "store" ? storeDistanceKm : flow.providerDistanceKm
                }
                providerLatitude={cartGroup.providerLatitude}
                providerLongitude={cartGroup.providerLongitude}
                providerAddress={cartGroup.providerAddress}
                areaRequestStatus={flow.areaRequestStatus}
                onRequestAreaCoverage={flow.requestAreaCoverage}
                addressLocationError={
                  flow.serviceAddressNeedsLocation
                    ? t("checkoutPage.errors.serviceAddressNeedsLocation")
                    : null
                }
              />
            </div>

            <div className="order-3 w-full px-4 xl:hidden">
              <MobileItemsSection
                cartGroup={pricedGroup}
                deliveryNote={flow.deliveryNote}
                onDeliveryNoteChange={flow.setDeliveryNote}
              />
            </div>

            <div className="order-5 w-full px-4 xl:hidden">
              <MobileOffersSection
                offers={flow.offers}
                offersStatus={flow.offersStatus}
                appliedPromo={flow.appliedPromo}
                promoStatus={flow.promoStatus}
                promoError={flow.promoError ?? flow.serverPromoError}
                onApplyPromo={flow.applyPromo}
                onApplyPromoCode={flow.applyPromoCode}
                onRemovePromo={flow.removePromo}
              />
            </div>

            <div className="order-6 w-full px-4 xl:hidden">
              <MobileBillDetailsSection
                cartGroup={pricedGroup}
                finalAmount={flow.finalAmount}
                promoDiscount={flow.effectivePromoDiscount}
              />
            </div>

            <div className="order-2 w-full px-4 xl:order-3 xl:px-0">
              <BillingAddressSection billing={flow.billing} />
            </div>

            <div className="order-7 w-full px-4 xl:order-4 xl:px-0">
              <PaymentMethodSection
                isPayLaterAllowed={Boolean(cartGroup.isPayLaterAllowed)}
                isOnlinePaymentAllowed={Boolean(cartGroup.isOnlinePaymentAllowed)}
                gatewaySettings={gatewaySettings}
                paymentMethod={flow.paymentMethod}
                onPaymentMethodChange={flow.setPaymentMethod}
              />
            </div>
          </div>

          <div className="hidden w-full xl:col-span-4 xl:flex">
            <CheckoutOrderSummary
              cartGroup={pricedGroup}
              canCheckout={flow.canCheckout}
              isProcessingCheckout={flow.isProcessingCheckout}
              onCheckout={flow.handleCheckout}
              finalAmount={flow.finalAmount}
              offers={flow.offers}
              offersStatus={flow.offersStatus}
              appliedPromo={flow.appliedPromo}
              promoDiscount={flow.effectivePromoDiscount}
              promoStatus={flow.promoStatus}
              promoError={flow.promoError ?? flow.serverPromoError}
              onApplyPromo={flow.applyPromo}
              onApplyPromoCode={flow.applyPromoCode}
              onRemovePromo={flow.removePromo}
            />
          </div>
        </div>
      </div>

      <MobilePaymentBar
        isPayLaterAllowed={Boolean(cartGroup.isPayLaterAllowed)}
        isOnlinePaymentAllowed={Boolean(cartGroup.isOnlinePaymentAllowed)}
        gatewaySettings={gatewaySettings}
        paymentMethod={flow.paymentMethod}
        onPaymentMethodChange={flow.setPaymentMethod}
        finalAmount={flow.finalAmount}
        canCheckout={flow.canCheckout}
        isProcessingCheckout={flow.isProcessingCheckout}
        onCheckout={flow.handleCheckout}
      />

      <StripePaymentModal
        open={flow.stripeModal.open}
        clientSecret={flow.stripeModal.clientSecret}
        publishableKey={gatewaySettings.stripe_publishable_key ?? ""}
        onClose={flow.handleStripeModalClose}
        onSuccess={flow.handleStripeModalSuccess}
        onFailure={flow.handleStripeModalFailure}
      />
    </>
  );
}
