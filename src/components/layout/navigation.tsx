"use client";

import { useEffect, useRef, useState } from "react";
import { Link } from "@/components/ui/locale-link";
import { ChevronDownIcon } from "@/components/icons/icons";
import logo from "@/assets/brand/logo.svg";
import whiteLogo from "@/assets/brand/white_logo.svg";
import { mainNavItems } from "@/lib/navigation-config";
import { NavLink } from "@/components/layout/nav-link";
import { AppButton } from "@/components/ui/app-button";
import { AppImage } from "@/components/ui/app-image";
import { CartDropdown } from "@/components/layout/cart-dropdown";
import { RequestServiceModal } from "@/components/layout/request-service-modal";
import { useRequireAuth } from "@/lib/use-require-auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTranslation } from "@/lib/i18n/translation-context";
import { useAppSelector } from "@/store/hooks";
import { useIsDarkMode } from "@/lib/use-is-dark-mode";

export function Navigation() {
  const { t } = useTranslation();
  const { requireAuth } = useRequireAuth();
  const isDark = useIsDarkMode();
  // Custom job requests are tied to a service location — no location, no "where" to request
  // service for, so hide the entry point until one's picked instead of letting the modal open
  // and fail downstream.
  const hasLocation = useAppSelector((state) => Boolean(state.location.current));
  const [requestServiceOpen, setRequestServiceOpen] = useState(false);
  const [progress, setProgress] = useState(0);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const revealDistanceRef = useRef(1);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const measure = () => {
      const distance = sentinel.getBoundingClientRect().top + window.scrollY;
      revealDistanceRef.current = distance > 0 ? distance : 1;
    };

    let ticking = false;
    const updateProgress = () => {
      const ratio = window.scrollY / revealDistanceRef.current;
      setProgress(Math.min(Math.max(ratio, 0), 1));
      ticking = false;
    };
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(updateProgress);
    };
    const onResize = () => {
      measure();
      updateProgress();
    };

    measure();
    updateProgress();

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <>
      <div ref={sentinelRef} className="hidden xl:block" />
      <div className="sticky top-0 z-40 hidden border-b border-border-default bg-bg-primary py-4 xl:block">
        <div className="container flex items-center gap-6">
          <Link
            href="/"
            className="flex shrink-0 items-center overflow-hidden"
            style={{ width: `${progress * 177}px` }}
          >
            <AppImage
              src={isDark ? whiteLogo : logo}
              alt="eDemand"
              className="h-11 w-auto shrink-0"
              style={{
                width: "auto",
                opacity: progress,
                transform: `translateY(${(1 - progress) * -24}px)`,
              }}
            />
          </Link>

          <nav className="flex flex-1 items-center gap-6">
            {mainNavItems.map((item) =>
              item.children ? (
                <DropdownMenu key={item.href}>
                  <DropdownMenuTrigger className="flex items-center gap-2 text-base text-text-primary">
                    {t(item.labelKey)}
                    <ChevronDownIcon className="size-4 text-icon-primary" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    {item.children.map((child) => (
                      <DropdownMenuItem key={child.href} asChild>
                        <Link href={child.href}>{t(child.labelKey)}</Link>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <NavLink
                  key={item.href}
                  href={item.href}
                  className="text-base"
                  activeClassName="text-text-brand font-normal"
                  inactiveClassName="text-text-primary font-normal"
                >
                  {t(item.labelKey)}
                </NavLink>
              )
            )}
          </nav>

          <div className="flex shrink-0 items-center gap-4">
            {hasLocation && (
              <AppButton
                variant="secondary"
                size="md"
                onClick={() => requireAuth(() => setRequestServiceOpen(true))}
              >
                {t("header.requestService")}
              </AppButton>
            )}
            <CartDropdown />
          </div>
        </div>
      </div>

      <RequestServiceModal open={requestServiceOpen} onOpenChange={setRequestServiceOpen} />
    </>
  );
}
