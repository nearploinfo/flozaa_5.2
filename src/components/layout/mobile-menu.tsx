"use client";

import { useState } from "react";
import { Link } from "@/components/ui/locale-link";
import { Menu } from "lucide-react";
import { mainNavItems } from "@/lib/navigation-config";
import { NavLink } from "@/components/layout/nav-link";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { LocationPicker } from "@/components/layout/location-picker";
import { AppButton } from "@/components/ui/app-button";
import { useTranslation } from "@/lib/i18n/translation-context";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";

export function MobileMenu() {
  const [open, setOpen] = useState(false);
  const { t } = useTranslation();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        aria-label={t("common.openMenu")}
        className="flex shrink-0 items-center justify-center rounded-full border border-form-field-border bg-form-field-bg p-2.5"
      >
        <Menu className="size-5 text-icon-primary" />
      </SheetTrigger>
      <SheetContent side="right" className="w-full gap-0 overflow-y-auto p-0">
        <SheetHeader className="border-b border-border-default">
          <SheetTitle>{t("common.menu")}</SheetTitle>
        </SheetHeader>

        <div className="flex flex-col gap-6 p-4">
          <LocationPicker />

          <nav className="flex flex-col">
            {mainNavItems.map((item) =>
              item.children ? (
                <Accordion key={item.href} type="single" collapsible>
                  <AccordionItem value={item.href} className="border-b-0">
                    <AccordionTrigger className="py-3 text-base text-text-primary hover:no-underline">
                      {t(item.labelKey)}
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="flex flex-col gap-1 ps-4">
                        {item.children.map((child) => (
                          <Link
                            key={child.href}
                            href={child.href}
                            onClick={() => setOpen(false)}
                            className="py-2 text-base text-text-secondary"
                          >
                            {t(child.labelKey)}
                          </Link>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              ) : (
                <NavLink
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="border-b border-border-default py-3 text-base"
                  activeClassName="text-text-brand font-normal"
                  inactiveClassName="text-text-primary font-normal"
                >
                  {t(item.labelKey)}
                </NavLink>
              )
            )}
          </nav>

          <AppButton variant="secondary" size="md" asChild>
            <Link href="/services" onClick={() => setOpen(false)}>
              {t("header.requestService")}
            </Link>
          </AppButton>

          <div className="flex items-center justify-between border-t border-border-default pt-6">
            <ThemeToggle />
            <LanguageSwitcher />
          </div>

          <AppButton variant="primary" size="md" asChild>
            <Link href="/login" onClick={() => setOpen(false)}>
              {t("header.login")}
            </Link>
          </AppButton>
        </div>
      </SheetContent>
    </Sheet>
  );
}
