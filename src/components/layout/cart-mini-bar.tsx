"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { AppImage } from "@/components/ui/app-image";
import { ChevronArrowRightIcon } from "@/components/icons/icons";
import { ClearCartSheet } from "@/components/cart/clear-cart-sheet";
import { CartSheet } from "@/components/cart/cart-sheet";
import { useCart } from "@/lib/use-cart";
import { useShowPrice } from "@/lib/show-price";
import { useTranslation } from "@/lib/i18n/translation-context";
import { useParamsCompat, usePathnameCompat } from "@/lib/next-router-compat";
import { localizePath } from "@/lib/i18n/locale-path";

/** Global cart bar — shows on any page that lists ServiceCards (home,
 * /services, search results, bookmarks, etc.) whenever the cart has items.
 * Suppressed on checkout and provider-details, which own their own cart
 * entry point (ProviderCartBar / checkout's header icon) — mounting a
 * second Drawer/CartSheet there fights over pointer capture.
 *
 * Two looks: home page gets a card above the bottom nav with a close
 * button that opens a confirm-clear sheet; every other page gets a
 * full-width bar pinned to the bottom edge instead. */
export function CartMiniBar() {
  const { t, lang, defaultLocale } = useTranslation();
  const router = useRouter();
  const { data } = useCart();
  const pathname = usePathnameCompat();
  const params = useParamsCompat<{ lang?: string }>();
  const routeLang = params?.lang;
  const localePath =
    routeLang && pathname.startsWith(`/${routeLang}`)
      ? pathname.slice(routeLang.length + 1) || "/"
      : pathname;
  const totalText = useShowPrice(data?.totalOverallAmount ?? 0);
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);
  const [cartSheetOpen, setCartSheetOpen] = useState(false);

  const totalServiceCount = data?.totalServiceCount ?? 0;

  const isHome = localePath === "/";

  // Checkout's switch-provider icon sends the user here with this flag when
  // there's more than one provider to pick from, so the picker sheet opens
  // on landing instead of requiring a second tap on "View".
  useEffect(() => {
    if (!isHome || router.query.openCartSheet !== "1") return;
    setCartSheetOpen(true);
    const { openCartSheet: _openCartSheet, ...rest } = router.query;
    router.replace({ pathname: router.pathname, query: rest }, undefined, { shallow: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- one-shot consume-on-landing, not tied to router identity
  }, [isHome, router.query.openCartSheet]);
  // Only pages that actually render a ServiceCard (add-to-cart entry point)
  // get the bar. /providers, /checkout, /provider-details, and the
  // bottom-nav pages (bookings/chats/request/profile) all show neither.
  const isServiceCardPage =
    isHome ||
    localePath === "/services" ||
    localePath === "/bookmarks" ||
    localePath.startsWith("/search") ||
    localePath.startsWith("/service-details");
  const isVisible = totalServiceCount > 0 && isServiceCardPage;

  // Single provider in cart — skip the provider-picker sheet and go straight
  // to checkout for it; the sheet only earns its keep when there's an actual
  // choice to make between providers.
  const handleViewCart = () => {
    const carts = data?.carts ?? [];
    if (carts.length === 1) {
      router.push(localizePath(`/checkout?cartId=${carts[0].cartId}`, lang, defaultLocale));
      return;
    }
    setCartSheetOpen(true);
  };

  return (
    <>
      <AnimatePresence>
      {isVisible && data && isHome && (
        <motion.div
          key="cart-mini-bar"
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="cart-mini-bar-active fixed inset-x-0 bottom-18 z-40 flex items-center gap-4 rounded-t-2xl border-t border-border-default bg-bg-primary p-4 shadow-[0px_4px_16px_0px_rgba(0,0,0,0.08)] xl:hidden"
        >
          <div className="flex shrink-0 items-center">
            {data.carts.slice(0, 3).map((group, index) => (
              <AppImage
                key={group.cartId}
                src={group.providerImage ?? ""}
                alt={group.companyName}
                className={`size-8 rounded-full border-[1.5px] border-bg-primary object-cover shadow-[0px_4px_32px_0px_rgba(0,0,0,0.08)] ${index > 0 ? "-ml-3" : ""}`}
              />
            ))}
          </div>

          <div className="flex min-w-0 flex-1 flex-col items-start justify-center gap-1">
            <div className="w-full truncate text-sm font-semibold text-text-primary">
              {t(totalServiceCount === 1 ? "common.serviceInCart" : "common.servicesInCart", {
                count: totalServiceCount,
              })}
            </div>
            <div className="flex w-full items-center gap-1 truncate text-xs text-icon-secondary">
              <span className="shrink-0">{t("common.providersCount", { count: data.totalProviderCount })}</span>
              <span className="size-1 shrink-0 rounded-full bg-icon-secondary" />
              <span className="truncate">{totalText}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleViewCart}
            className="shrink-0 rounded-xl bg-bg-brand px-3 py-2 text-sm font-normal whitespace-nowrap text-button-primary-text"
          >
            {t("common.viewCart")}
          </button>

          <button
            type="button"
            onClick={() => setConfirmClearOpen(true)}
            aria-label={t("common.close")}
            className="shrink-0 text-icon-primary"
          >
            <X className="size-6" />
          </button>
        </motion.div>
      )}

      {isVisible && data && !isHome && (
        <motion.div
          key="cart-mini-bar-compact"
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="cart-mini-bar-active-compact fixed inset-x-0 bottom-0 z-40 p-3 xl:hidden"
        >
          <button
            type="button"
            onClick={handleViewCart}
            className="flex w-full items-center gap-4 rounded-2xl bg-bg-brand p-4 shadow-[0px_-4px_64px_0px_rgba(0,0,0,0.12)]"
          >
            <div className="flex shrink-0 items-center">
              {data.carts.slice(0, 3).map((group, index) => (
                <AppImage
                  key={group.cartId}
                  src={group.providerImage ?? ""}
                  alt={group.companyName}
                  className={`size-8 rounded-full border-[1.33px] border-border-white object-cover ${index > 0 ? "-ml-3" : ""}`}
                />
              ))}
            </div>

            <div className="flex flex-1 flex-col items-start justify-center gap-0.5">
              <span className="text-sm font-semibold text-text-inverse-light">
                {t(totalServiceCount === 1 ? "common.serviceAdded" : "common.servicesAdded", {
                  count: totalServiceCount,
                })}
              </span>
              <span className="flex items-center gap-1 text-xs text-text-inverse-light">
                <span>{t("common.providersCount", { count: data.totalProviderCount })}</span>
                <span className="size-1 rounded-full bg-text-inverse-light" />
                <span>{totalText}</span>
              </span>
            </div>

            <span className="flex shrink-0 items-center gap-2 text-base font-semibold text-text-inverse-light">
              {t("common.view")}
              <ChevronArrowRightIcon className="size-5 text-text-inverse-light rtl:rotate-180" />
            </span>
          </button>
        </motion.div>
      )}

      </AnimatePresence>
      <ClearCartSheet open={confirmClearOpen} onOpenChange={setConfirmClearOpen} />
      <CartSheet open={cartSheetOpen} onOpenChange={setCartSheetOpen} />
    </>
  );
}
