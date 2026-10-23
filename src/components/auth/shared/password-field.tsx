"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { FormFieldLabel } from "@/components/auth/shared/form-field-label";
import { AppButton } from "@/components/ui/app-button";
import { useTranslation } from "@/lib/i18n/translation-context";

export function PasswordField({
  label,
  placeholder,
  value,
  onChange,
  onFocus,
  autoComplete,
  background = "secondary",
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  onFocus?: () => void;
  autoComplete?: string;
  /** "primary" (white) for pages whose card background is already the secondary gray. */
  background?: "secondary" | "primary";
}) {
  const [visible, setVisible] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const { t } = useTranslation();

  return (
    <div className="flex w-full flex-col items-start gap-2">
      <FormFieldLabel label={label} required />
      <div
        className={
          isFocused
            ? "flex w-full items-center gap-3 overflow-hidden rounded-sm border border-form-field-focus bg-form-field-bg px-4 py-2 shadow-[0px_0px_0px_3px_rgba(0,121,255,0.10)]"
            : `flex w-full items-center gap-3 rounded-sm border border-form-field-border px-4 py-2 ${
                background === "primary" ? "bg-bg-primary" : "bg-bg-secondary"
              }`
        }
      >
        <input
          type={visible ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onFocus={() => {
            setIsFocused(true);
            onFocus?.();
          }}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className="flex-1 bg-transparent text-base text-form-field-text placeholder:text-form-field-placeholder focus:outline-none"
        />
        <AppButton
          variant="link"
          size="sm"
          iconOnly
          leftIcon={visible ? EyeOff : Eye}
          aria-label={visible ? t("auth.password.hide") : t("auth.password.show")}
          onClick={() => setVisible((current) => !current)}
          className="shrink-0 p-0 text-form-field-placeholder"
        >
          {visible ? t("auth.password.hide") : t("auth.password.show")}
        </AppButton>
      </div>
    </div>
  );
}
