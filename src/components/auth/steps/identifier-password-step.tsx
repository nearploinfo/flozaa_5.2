"use client";

import { useState } from "react";
import { MailIcon, PhoneIcon, GoogleIcon } from "@/components/icons/icons";
import { AuthErrorBanner } from "@/components/auth/shared/auth-error-banner";
import { AuthMethodButton } from "@/components/auth/shared/auth-method-button";
import { AuthDivider } from "@/components/auth/shared/auth-divider";
import { PhoneNumberField } from "@/components/auth/shared/phone-number-field";
import { TextField } from "@/components/auth/shared/text-field";
import { PasswordField } from "@/components/auth/shared/password-field";
import { AppButton } from "@/components/ui/app-button";
import { useLoginSettings } from "@/lib/auth-settings";
import { useTranslation } from "@/lib/i18n/translation-context";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Identifier + password sign-in — used once the account is known to have a password set. */
export function IdentifierPasswordStep({
  mode,
  variant = "signin",
  initialIdentifier = "",
  initialDialCode = "+91",
  initialPassword = "",
  loading = false,
  errorMessage,
  submitLabel,
  onContinue,
  onForgotPassword,
  onContinueWithGoogle,
  onContinueWithOtherIdentifier,
  onSwitchToSignUp,
}: {
  mode: "phone" | "email";
  /** "signin" says "Sign in with Google/Email"; "signup" says "Continue with Google/Email". */
  variant?: "signin" | "signup";
  initialIdentifier?: string;
  initialDialCode?: string;
  /** Demo-mode password pre-fill. */
  initialPassword?: string;
  loading?: boolean;
  errorMessage?: string | null;
  /** Defaults to "Continue" — sign-in passes "Sign In" instead. */
  submitLabel?: string;
  /** For phone mode, `identifier` is the national number and `dialCode` has a leading "+" (e.g. "+91"). */
  onContinue: (identifier: string, password: string, dialCode?: string) => void;
  onForgotPassword: (identifier: string, dialCode?: string) => void;
  onContinueWithGoogle: () => void;
  onContinueWithOtherIdentifier: () => void;
  onSwitchToSignUp: () => void;
}) {
  const [identifier, setIdentifier] = useState(initialIdentifier);
  const [phoneFullValue, setPhoneFullValue] = useState(initialDialCode + initialIdentifier);
  const [dialCode, setDialCode] = useState(initialDialCode);
  const [password, setPassword] = useState(initialPassword);
  const loginSettings = useLoginSettings();
  const { t } = useTranslation();
  const otherIdentifierEnabled =
    mode === "phone"
      ? loginSettings.email_authentication_enabled
      : loginSettings.phone_authentication_enabled;

  const isValid =
    (mode === "phone"
      ? identifier.replace(/\D/g, "").length >= 7
      : EMAIL_PATTERN.test(identifier)) && password.length > 0;

  return (
    <>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (isValid && !loading) onContinue(identifier, password, mode === "phone" ? dialCode : undefined);
        }}
        className="flex flex-col items-center gap-6 self-stretch p-6"
      >
        {errorMessage && <AuthErrorBanner message={errorMessage} />}
        <div className="flex flex-col items-start gap-6 self-stretch">
          {mode === "phone" ? (
            <PhoneNumberField
              value={phoneFullValue}
              onChange={(full, dial, national) => {
                setPhoneFullValue(full);
                setDialCode(dial);
                setIdentifier(national);
              }}
              autoFocus
            />
          ) : (
            <TextField
              label={t("auth.email.label")}
              type="email"
              placeholder={t("auth.email.placeholder")}
              value={identifier}
              onChange={setIdentifier}
              autoFocus
              autoComplete="email"
            />
          )}

          <div className="flex w-full flex-col items-end gap-2">
            <PasswordField
              label={t("auth.password.label")}
              placeholder={t("auth.password.placeholder")}
              value={password}
              onChange={setPassword}
              autoComplete="current-password"
            />
            <AppButton
              variant="link"
              size="sm"
              disabled={loading}
              onClick={() => onForgotPassword(identifier, mode === "phone" ? dialCode : undefined)}
              className="h-auto p-0 text-sm font-medium text-text-brand hover:text-text-brand"
            >
              {t("auth.password.forgot")}
            </AppButton>
          </div>
        </div>

        {(loginSettings.social_authentication_enabled || otherIdentifierEnabled) && (
          <div className="flex flex-col items-center gap-4 self-stretch">
            <AuthDivider label={t("auth.orContinueWith")} />
            {loginSettings.social_authentication_enabled && (
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
            {loading ? t("auth.pleaseWait") : (submitLabel ?? t("auth.continue"))}
          </AppButton>
          <p className="text-sm text-text-primary">
            {t("auth.signin.noAccount")}{" "}
            <AppButton
              variant="link"
              size="sm"
              onClick={onSwitchToSignUp}
              className="h-auto p-0 font-medium text-text-brand hover:text-text-brand"
            >
              {t("auth.signin.signUp")}
            </AppButton>
          </p>
        </div>
      </form>
    </>
  );
}
