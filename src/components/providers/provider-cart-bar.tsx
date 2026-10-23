"use client";

import { AnimatePresence, motion } from "motion/react";
import { Link } from "@/components/ui/locale-link";
import { AppImage } from "@/components/ui/app-image";
import { ArrowRightIcon } from "@/components/icons/icons";
import { useCart } from "@/lib/use-cart";
import { useShowPrice } from "@/lib/show-price";
import { useTranslation } from "@/lib/i18n/translation-context";

/** Provider-specific cart bar — shown only on a provider's detail page while
 * that provider has items in the cart, so the user can add multiple services
 * from the known provider and continue to checkout without picking a
 * provider again. The bottom nav is already hidden on this page, so this
 * bar owns the full bottom edge instead of sitting above it. */
export function ProviderCartBar({
  providerId,
  providerImage,
}: {
  providerId: number;
  providerImage: string;
}) {
  const { t } = useTranslation();
  const { data } = useCart();
  const group = data?.carts.find((cart) => cart.providerId === providerId);
  const totalText = useShowPrice(group?.subTotal ?? 0);

  const isVisible = !!group && group.totalQuantity > 0;

  return (
    <AnimatePresence>
      {isVisible && group && (
        <motion.div
          key="provider-cart-bar"
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="fixed inset-x-0 bottom-0 z-40 overflow-hidden bg-bg-primary p-3 shadow-[0px_-4px_24px_0px_rgba(0,0,0,0.06)] xl:hidden"
        >
          <div className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-button-primary-bg p-3">
            <div className="flex shrink-0 items-center">
              <AppImage
                src={group.providerImage || providerImage}
                alt={group.companyName}
                className="size-6 rounded-full border border-border-white object-cover shadow-[0px_3px_24px_0px_rgba(0,0,0,0.08)]"
              />
            </div>

            <div className="flex flex-1 items-center gap-1">
              <span className="text-base font-medium text-text-inverse-light">
                {t("common.servicesCount", { count: group.totalQuantity })}
              </span>
              <span className="size-1 rounded-full bg-text-inverse-light" />
              <span className="text-base font-medium text-text-inverse-light">{totalText}</span>
            </div>

            <Link
              href={`/checkout?cartId=${group.cartId}`}
              className="flex shrink-0 items-center gap-2 rounded-xl bg-white/15 px-3 py-2 text-sm font-normal text-button-primary-text"
            >
              {t("providerDetails.cartBar.continue")}
              <ArrowRightIcon className="size-5 text-text-inverse-light rtl:rotate-180" />
            </Link>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
