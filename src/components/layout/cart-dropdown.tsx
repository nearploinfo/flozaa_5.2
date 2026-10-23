"use client";

import { useEffect, useRef, useState } from "react";
import { XIcon } from "lucide-react";
import { toast } from "sonner";
import { Link } from "@/components/ui/locale-link";
import { CartIcon } from "@/components/icons/icons";
import { AppButton } from "@/components/ui/app-button";
import { AppImage } from "@/components/ui/app-image";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTranslation } from "@/lib/i18n/translation-context";
import { usePriceFormatter } from "@/lib/show-price";
import { removeFromCartApi } from "@/api/apiRoutes";
import { normalizeCartResponse, mergeCartData } from "@/lib/cart-types";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setCartData } from "@/store/slices/cart-slice";
import { useCart } from "@/lib/use-cart";
import { CART_BUTTON_ID, CART_FLY_ARRIVED_EVENT } from "@/lib/fly-to-cart";

export function CartDropdown() {
  const { t } = useTranslation();
  const showPrice = usePriceFormatter();
  const dispatch = useAppDispatch();
  const lat = useAppSelector((state) => state.location.lat);
  const lng = useAppSelector((state) => state.location.lng);
  const { data } = useCart();
  const [pending, setPending] = useState(false);
  // Uncontrolled Radix DropdownMenu only auto-closes on a real
  // DropdownMenuItem select — a plain <Link> inside the content (the
  // checkout button) doesn't trigger that, so it stays open after
  // navigating to /cart unless closed explicitly here.
  const [open, setOpen] = useState(false);

  const items = (data?.carts ?? []).flatMap((group) =>
    group.items.map((item) => ({
      id: item.serviceId,
      name: item.serviceTitle ?? "",
      image: item.image,
      price: item.discountedPrice || item.price,
      quantity: item.qty,
    }))
  );

  const subtotal = data?.totalOverallAmount ?? 0;
  const count = data?.totalServiceCount ?? 0;

  // The cart icon bounces on two signals: the moment a "fly to cart" flight
  // (service-card.tsx) lands — an immediate, optimistic reaction that
  // doesn't wait on the add-to-cart request — and whenever the real count
  // goes up for any other reason (cart page stepper, rebook, etc., which
  // don't fly anything). Never on a decrease/removal, never on mount
  // (`prevCount` starts `null` so the first render is never an "increase").
  const [bounceKey, setBounceKey] = useState(0);
  const triggerBounce = () => setBounceKey((key) => key + 1);
  const prevCountRef = useRef<number | null>(null);
  useEffect(() => {
    const prevCount = prevCountRef.current;
    prevCountRef.current = count;
    if (prevCount !== null && count > prevCount) triggerBounce();
  }, [count]);
  useEffect(() => {
    window.addEventListener(CART_FLY_ARRIVED_EVENT, triggerBounce);
    return () => window.removeEventListener(CART_FLY_ARRIVED_EVENT, triggerBounce);
  }, []);

  const runMutation = async (params: Record<string, string | number>) => {
    if (pending) return;
    setPending(true);
    try {
      const response = await removeFromCartApi({
        ...params,
        from_new_app: 1,
        ...(lat != null && lng != null ? { latitude: lat, longitude: lng } : {}),
      });
      if (response?.error) throw new Error(response?.message);
      dispatch(setCartData(mergeCartData(data, normalizeCartResponse(response?.data))));
    } catch (error) {
      toast.error(error instanceof Error && error.message ? error.message : t("common.cart.error"));
    } finally {
      setPending(false);
    }
  };

  const removeItem = (serviceId: number) => runMutation({ service_id: serviceId });
  const clearCart = () => runMutation({ clear_all: 1 });

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <AppButton id={CART_BUTTON_ID} variant="secondary-outline" size="md">
          {/* Remounting on `bounceKey` restarts the CSS animation every time,
              not just the first — a class toggle alone wouldn't re-trigger
              it on back-to-back adds. */}
          <span key={bounceKey} className={cn("inline-flex", bounceKey > 0 && "cart-icon-bounce")}>
            <CartIcon className="size-6" />
          </span>
          {t("nav.cart", { count })}
        </AppButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-96 gap-0 rounded-lg p-0">
        <div className="flex items-center justify-start self-stretch p-4">
          <span className="text-base font-medium text-text-primary">{t("cartDropdown.title")}</span>
        </div>

        <div className="flex flex-col items-start gap-6 self-stretch px-4 pb-4">
          {items.length === 0 ? (
            <p className="self-stretch py-6 text-center text-sm text-text-secondary">
              {t("cartDropdown.empty")}
            </p>
          ) : (
            <>
              <div className="thin-scrollbar flex max-h-72 w-full flex-col items-start gap-4 overflow-y-auto pe-1">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-4 self-stretch rounded-lg bg-bg-secondary p-4"
                  >
                    <div className="size-12 shrink-0 overflow-hidden rounded-lg bg-bg-tertiary">
                      <AppImage
                        src={item.image ?? ""}
                        alt={item.name}
                        className="size-12 rounded-lg object-cover"
                      />
                    </div>
                    <div className="flex flex-1 flex-col items-start gap-1 self-stretch">
                      <span className="line-clamp-1 self-stretch text-base font-medium text-text-primary">
                        {item.name}
                      </span>
                      <div className="flex items-center gap-1 self-stretch">
                        <span className="text-base font-medium text-text-brand">
                          {showPrice(item.price)}
                        </span>
                        <span className="text-base text-text-secondary">
                          {t("cartDropdown.quantity", { count: item.quantity })}
                        </span>
                      </div>
                    </div>
                    <AppButton
                      variant="secondary-outline"
                      size="sm"
                      iconOnly
                      leftIcon={XIcon}
                      disabled={pending}
                      onClick={() => removeItem(item.id)}
                      aria-label={t("cartDropdown.removeItem")}
                    >
                      {t("cartDropdown.removeItem")}
                    </AppButton>
                  </div>
                ))}
              </div>

              <div className="dashed-divider" />

              <div className="flex flex-col items-start gap-4 self-stretch">
                <div className="flex items-center gap-4 self-stretch">
                  <span className="flex-1 text-base text-text-primary">
                    {t("cartDropdown.subtotal")}
                  </span>
                  <span className="flex-1 text-right text-base font-medium text-text-primary">
                    {showPrice(subtotal)}
                  </span>
                </div>
                <div className="flex items-center gap-4 self-stretch">
                  <AppButton
                    variant="secondary-outline"
                    size="md"
                    disabled={pending}
                    onClick={clearCart}
                  >
                    {t("cartDropdown.clearCart")}
                  </AppButton>
                  <AppButton variant="primary" size="md" asChild className="flex-1">
                    <Link href="/cart" onClick={() => setOpen(false)}>
                      {t("cartDropdown.checkout")}
                    </Link>
                  </AppButton>
                </div>
              </div>
            </>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
