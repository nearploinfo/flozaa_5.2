"use client";

import { Link } from "@/components/ui/locale-link";
import { useTranslation } from "@/lib/i18n/translation-context";

export function AuthFooter() {
  const { t } = useTranslation();
  return (
    <div className="flex items-end justify-center self-stretch border-t border-border-default px-6 pt-4 pb-6">
      <p className="text-center text-sm text-text-primary">
        {t("auth.footer.prefix")}{" "}
        <Link href="/terms-and-conditions" className="text-text-brand underline">
          {t("auth.footer.terms")}
        </Link>{" "}
        &amp;{" "}
        <Link href="/privacy-policy" className="text-text-brand underline">
          {t("auth.footer.privacy")}
        </Link>
      </p>
    </div>
  );
}
