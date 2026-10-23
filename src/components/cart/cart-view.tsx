"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { toast } from "sonner";
import { PageBreadcrumb } from "@/components/layout/page-breadcrumb";
import { EmptyCartIllustration } from "@/components/common/empty-cart-illustration";
import { AppButton } from "@/components/ui/app-button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@/components/ui/locale-link";
import { ProviderCartCard } from "@/components/cart/provider-cart-card";
import { OrderSummary } from "@/components/cart/order-summary";
import { useTranslation } from "@/lib/i18n/translation-context";
import { localizePath } from "@/lib/i18n/locale-path";
import { useCart } from "@/lib/use-cart";
import { usePromoCode } from "@/lib/checkout/use-promo-code";
import { manageCartApi, removeFromCartApi } from "@/api/apiRoutes";
import {
  normalizeCartResponse,
  mergeCartData,
  cartPayableAmount,
  cartPrePromoAmount,
  cartPromoSaving,
  toBillLines,
  type CartGroup,
} from "@/lib/cart-types";
import { useCartPricing } from "@/lib/checkout/use-cart-pricing";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setCartData } from "@/store/slices/cart-slice";

/** Stand-in while no cart is selected — useCartPricing needs a group to fall
 * back to, and it's disabled in that state anyway. */
const EMPTY_GROUP: CartGroup = {
  cartId: 0,
  providerId: 0,
  companyName: "",
  isProviderVerified: false,
  totalQuantity: 0,
  subTotal: 0,
  items: [],
};

export function CartView() {
  const { t, lang, defaultLocale } = useTranslation();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const lat = useAppSelector((state) => state.location.lat);
  const lng = useAppSelector((state) => state.location.lng);
  const { data, status } = useCart();
  const groups = data?.carts ?? [];

  // Checkout only ever books one provider's cart at a time — radio, not
  // checkboxes. null = user hasn't touched selection yet — derive the
  // default (first cart) straight from data instead of syncing via an effect.
  const [selectedCartIdOverride, setSelectedCartIdOverride] = useState<number | null | undefined>(
    undefined
  );
  const [pending, setPending] = useState(false);

  const selectedCartId =
    selectedCartIdOverride !== undefined ? selectedCartIdOverride : (groups[0]?.cartId ?? null);

  const selectedGroup = useMemo(
    () => groups.find((entry) => entry.cartId === selectedCartId) ?? null,
    [groups, selectedCartId]
  );

  const {
    offers,
    offersStatus,
    appliedPromo,
    promoDiscount,
    promoStatus,
    promoError,
    applyPromo,
    applyPromoCode,
    removePromo,
  } = usePromoCode(selectedGroup?.providerId ?? null, selectedGroup?.subTotalWithoutTax ?? 0, selectedCartId);

  // The total is the server's `final_total`, which only get_cart can work out
  // (country/region tax rules, visiting-charge tax, per-fee tax, and the tax
  // the promo removes) — so the selected cart is re-priced whenever the cart
  // or the applied promo changes, instead of subtracting the discount here.
  const { group: pricedGroup, isPriced } = useCartPricing({
    fallback: selectedGroup ?? EMPTY_GROUP,
    cartId: selectedCartId,
    promoCodeId: appliedPromo?.id ?? null,
    enabled: selectedGroup !== null,
  });

  // Applying a promo here only re-prices `pricedGroup` locally — it never
  // goes through runMutation, so redux's cart slice (what checkout's initial
  // `cartGroup` fallback reads) never learns the promo was applied, and it
  // silently vanishes when the user navigates straight to /checkout without
  // first changing a quantity. Sync every successful re-price back into
  // redux so the applied promo (and the rest of the latest pricing) survives
  // that navigation — contentsKey inside useCartPricing is derived from
  // primitive totals, so writing the same group back doesn't itself trigger
  // another re-price.
  useEffect(() => {
    if (!isPriced) return;
    dispatch(
      setCartData(
        mergeCartData(data, {
          carts: [pricedGroup],
          totalServiceCount: 0,
          totalProviderCount: 0,
          totalOverallAmount: 0,
        })
      )
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-sync only when the priced snapshot itself changes, not on every `data` identity change this dispatch causes
  }, [isPriced, pricedGroup]);

  const subtotal = pricedGroup.subTotalWithoutTax ?? 0;
  // taxTotal is the tax after the promo; taxValue is the pre-v5.2.0 fallback.
  const taxes = pricedGroup.taxTotal ?? pricedGroup.taxValue ?? 0;
  const fees = pricedGroup.feesTotal ?? 0;
  const visitingCharges = pricedGroup.visitingCharges ?? 0;
  const servicesCount = pricedGroup.totalQuantity;
  const finalAmount = isPriced
    ? cartPayableAmount(pricedGroup)
    : Math.max(0, cartPrePromoAmount(pricedGroup) - promoDiscount);
  // The discount the server actually applied — a code it couldn't use comes
  // back as promoError with the cart priced without it.
  const appliedDiscount = isPriced ? (pricedGroup.promo?.discount ?? 0) : promoDiscount;
  const savedAmount = isPriced ? cartPromoSaving(pricedGroup) : promoDiscount;

  const selectProvider = (cartId: number) => setSelectedCartIdOverride(cartId);

  const runMutation = async (params: Record<string, string | number>) => {
    if (pending) return;
    setPending(true);
    try {
      const isRemoval = "clear_all" in params || "provider_id" in params || ("service_id" in params && !("qty" in params));
      // Both mutations answer with a priced cart, so they take the same
      // promo/location params as get_cart — otherwise the snapshot they write
      // back drops the applied promo until the next re-price.
      const pricingParams = {
        from_new_app: 1,
        ...(appliedPromo ? { promo_code_id: appliedPromo.id } : {}),
        ...(lat != null && lng != null ? { latitude: lat, longitude: lng } : {}),
      };
      const response = isRemoval
        ? await removeFromCartApi({ ...params, ...pricingParams })
        : await manageCartApi({ ...params, ...pricingParams });
      if (response?.error) throw new Error(response?.message);
      // remove_from_cart answers with the full remaining cart snapshot (every
      // provider, not just the one touched) — replace outright instead of
      // merging, otherwise a provider that just emptied out survives the
      // merge as a stale "untouched" group. manage_cart only patches the one
      // touched provider's group, so that still needs the merge.
      dispatch(
        setCartData(
          isRemoval
            ? normalizeCartResponse(response?.data)
            : mergeCartData(data, normalizeCartResponse(response?.data))
        )
      );
    } catch (error) {
      toast.error(error instanceof Error && error.message ? error.message : t("common.cart.error"));
    } finally {
      setPending(false);
    }
  };

  const updateQuantity = (serviceId: number, quantity: number) =>
    runMutation({ service_id: serviceId, qty: quantity });

  const removeService = (serviceId: number) => runMutation({ service_id: serviceId });

  const clearProvider = (providerId: number, cartId: number) => {
    if (!providerId) return;
    if (selectedCartId === cartId) {
      const fallback = groups.find((group) => group.cartId !== cartId);
      setSelectedCartIdOverride(fallback?.cartId ?? null);
    }
    return runMutation({ provider_id: providerId });
  };

  if (status === "loading" && groups.length === 0) {
    return (
      <>
        <PageBreadcrumb title={t("cartPage.title")} items={[{ label: t("cartPage.title") }]} />
        <div className="flex w-full justify-center bg-bg-secondary py-6 lg:py-16 container mx-auto">
          <div className="container flex flex-col items-start gap-6 px-4 lg:flex-row lg:px-0">
            <div className="flex w-full flex-1 flex-col items-start gap-6 rounded-2xl border border-border-default bg-bg-primary p-6">
              <Skeleton className="h-6 w-40 rounded" />
              <Skeleton className="h-32 w-full rounded-xl" />
              <Skeleton className="h-32 w-full rounded-xl" />
            </div>
            <Skeleton className="h-64 w-full shrink-0 rounded-2xl bg-bg-tertiary lg:w-96" />
          </div>
        </div>
      </>
    );
  }

  if (groups.length === 0) {
    return (
      <>
        <PageBreadcrumb title={t("cartPage.title")} items={[{ label: t("cartPage.title") }]} />
        <div className="flex min-h-[679px] w-full flex-col items-center justify-center gap-10 bg-bg-primary px-6 py-16 lg:px-36">
          <EmptyCartIllustration className="h-auto w-56 text-icon-brand lg:w-72" />
          <div className="flex flex-col items-center gap-3 text-center">
            <h1 className="text-2xl font-medium text-text-primary lg:text-3xl">
              {t("cartPage.emptyTitle")}
            </h1>
            <p className="text-base text-text-secondary lg:text-xl">{t("cartPage.empty")}</p>
          </div>
          <AppButton variant="primary" size="lg" asChild>
            <Link href="/services">{t("cartPage.browseServices")}</Link>
          </AppButton>
        </div>
      </>
    );
  }

  const totalServicesCount = groups.reduce((sum, group) => sum + group.items.length, 0);

  return (
    <>
      <PageBreadcrumb title={t("cartPage.title")} items={[{ label: t("cartPage.title") }]} />

      <div className="flex w-full justify-center bg-bg-secondary py-6 lg:py-16">
        <div className="container flex flex-col items-start gap-6 lg:flex-row">
          <div className="flex w-full flex-1 flex-col items-start rounded-2xl border border-border-default bg-bg-primary">
            <div className="flex w-full items-center gap-2 border-b border-border-default p-6">
              <span className="flex-1 text-lg text-text-primary">{t("cartPage.yourCart")}</span>
              <span className="text-lg text-text-primary">
                {t("cartPage.servicesCount", { count: totalServicesCount })}
              </span>
            </div>

            <div className="flex w-full flex-col items-start gap-6 p-6">
              {groups.map((group) => (
                <ProviderCartCard
                  key={group.cartId}
                  group={group}
                  selected={selectedCartId === group.cartId}
                  pending={pending}
                  onSelect={() => selectProvider(group.cartId)}
                  onQuantityChange={updateQuantity}
                  onRemoveService={removeService}
                  onClear={() => clearProvider(group.providerId, group.cartId)}
                />
              ))}
            </div>
          </div>

          <OrderSummary
            subtotal={subtotal}
            taxes={taxes}
            fees={fees}
            visitingCharges={visitingCharges}
            finalAmount={finalAmount}
            servicesCount={servicesCount}
            canCheckout={selectedCartId !== null && servicesCount > 0}
            onCheckout={() =>
              router.push(localizePath(`/checkout?cartId=${selectedCartId}`, lang, defaultLocale))
            }
            offers={offers}
            offersStatus={offersStatus}
            appliedPromo={appliedPromo}
            promoDiscount={appliedDiscount}
            promoStatus={promoStatus}
            promoError={promoError ?? (isPriced ? (pricedGroup.promoError ?? null) : null)}
            prePromoAmount={cartPrePromoAmount(pricedGroup)}
            savedAmount={savedAmount}
            billLines={isPriced ? toBillLines(pricedGroup) : undefined}
            onApplyPromo={applyPromo}
            onApplyPromoCode={applyPromoCode}
            onRemovePromo={removePromo}
          />
        </div>
      </div>
    </>
  );
}
