"use client";

import { useState } from "react";
import { MailIcon, PhoneIcon, GoogleIcon } from "@/components/icons/icons";
import { AuthErrorBanner } from "@/components/auth/shared/auth-error-banner";
import { AuthMethodButton } from "@/components/auth/shared/auth-method-button";
import { AuthDivider } from "@/components/auth/shared/auth-divider";
import { PhoneNumberField } from "@/components/auth/shared/phone-number-field";
import { TextField } from "@/components/auth/shared/text-field";
import { AppButton } from "@/components/ui/app-button";
import { useLoginSettings } from "@/lib/auth-settings";
import { useTranslation } from "@/lib/i18n/translation-context";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * "Enter your phone/email to continue" screen — used for signup and the
 * passwordless sign-in entry point alike. Only copy and the destination of
 * "Continue with [other identifier]" differ between callers.
 */
export function IdentifierEntryStep({
  mode,
  variant = "signin",
  showGoogle = true,
  loading = false,
  errorMessage,
  initialNationalNumber = "",
  initialDialCode = "",
  onContinue,
  onContinueWithGoogle,
  onContinueWithOtherIdentifier,
  bottomText,
  bottomLinkLabel,
  onBottomLinkClick,
}: {
  mode: "phone" | "email";
  /** "signin" says "Sign in with Google/Email"; "signup" says "Continue with Google/Email". */
  variant?: "signin" | "signup";
  /** Hides the "Continue with Google" button regardless of `social_authentication_enabled` — used by flows (e.g. provider register) that don't support Google at all. */
  showGoogle?: boolean;
  loading?: boolean;
  errorMessage?: string | null;
  /** Demo-mode phone pre-fill — national number and dial code (leading "+"). Ignored in email mode. */
  initialNationalNumber?: string;
  initialDialCode?: string;
  /** For phone mode, `value` is the national number and `dialCode` has a leading "+" (e.g. "+91"). */
  onContinue: (value: string, dialCode?: string) => void;
  onContinueWithGoogle: () => void;
  onContinueWithOtherIdentifier: () => void;
  bottomText?: string;
  bottomLinkLabel?: string;
  onBottomLinkClick?: () => void;
}) {
  const [value, setValue] = useState(initialDialCode + initialNationalNumber);
  const [nationalNumber, setNationalNumber] = useState(initialNationalNumber);
  const [dialCode, setDialCode] = useState(initialDialCode);
  const loginSettings = useLoginSettings();
  const { t } = useTranslation();
  const otherIdentifierEnabled =
    mode === "phone"
      ? loginSettings.email_authentication_enabled
      : loginSettings.phone_authentication_enabled;
  const isValid =
    mode === "phone" ? nationalNumber.replace(/\D/g, "").length >= 7 : EMAIL_PATTERN.test(value);

  return (
    <>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (isValid && !loading) onContinue(mode === "phone" ? nationalNumber : value, dialCode);
        }}
        className="flex flex-col items-center gap-6 self-stretch p-6"
      >
        {errorMessage && <AuthErrorBanner message={errorMessage} />}
        {mode === "phone" ? (
          <PhoneNumberField
            value={value}
            onChange={(full, dial, national) => {
              setValue(full);
              setDialCode(dial);
              setNationalNumber(national);
            }}
            autoFocus
          />
        ) : (
          <TextField
            label={t("auth.email.label")}
            type="email"
            placeholder={t("auth.email.placeholder")}
            value={value}
            onChange={setValue}
            autoFocus
            autoComplete="email"
          />
        )}

        {((showGoogle && loginSettings.social_authentication_enabled) || otherIdentifierEnabled) && (
          <div className="flex flex-col items-center gap-4 self-stretch">
            <AuthDivider label={t("auth.orContinueWith")} />
            {showGoogle && loginSettings.social_authentication_enabled && (
              <AuthMethodButton
                icon={GoogleIcon}
                label={t(variant === "signin" ? "auth.methods.signinGoogle" : "auth.methods.google")}
                disabled={loading}
                onClick={onContinueWithGoogle}
              />
            )}
            {otherIdentifierEnabled &&
              (mode === "phone" ? (
                <AuthMethodButton
                  icon={MailIcon}
                  label={t(variant === "signin" ? "auth.methods.signinEmail" : "auth.methods.email")}
                  onClick={onContinueWithOtherIdentifier}
                />
              ) : (
                <AuthMethodButton
                  icon={PhoneIcon}
                  label={t(variant === "signin" ? "auth.methods.signinPhone" : "auth.methods.phone")}
                  onClick={onContinueWithOtherIdentifier}
                />
              ))}
          </div>
        )}

        <div className="flex flex-col items-center gap-2 self-stretch">
          <AppButton
            type="submit"
            variant="primary"
            size="md"
            disabled={!isValid || loading}
            className="w-full"
          >
            {loading ? t("auth.pleaseWait") : t("auth.continue")}
          </AppButton>
          {bottomText && bottomLinkLabel && onBottomLinkClick && (
            <p className="text-sm text-text-primary">
              {bottomText}{" "}
              <AppButton
                variant="link"
                size="sm"
                onClick={onBottomLinkClick}
                className="h-auto p-0 font-medium text-text-brand hover:text-text-brand"
              >
                {bottomLinkLabel}
              </AppButton>
            </p>
          )}
        </div>
      </form>
    </>
  );
}
