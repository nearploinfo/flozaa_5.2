"use client";

import { useState } from "react";
import { PasswordField } from "@/components/auth/shared/password-field";
import { AuthErrorBanner } from "@/components/auth/shared/auth-error-banner";
import {
  PasswordStrengthChecklist,
  passwordMeetsAllRules,
} from "@/components/auth/shared/password-strength-checklist";
import { AppButton } from "@/components/ui/app-button";
import { useLoginSettings } from "@/lib/auth-settings";
import { useTranslation } from "@/lib/i18n/translation-context";

export function SetPasswordStep({
  submitLabel,
  loading = false,
  errorMessage,
  onSubmit,
}: {
  submitLabel?: string;
  loading?: boolean;
  errorMessage?: string | null;
  onSubmit: (password: string) => void;
}) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordTouched, setPasswordTouched] = useState(false);
  const loginSettings = useLoginSettings();
  const { t } = useTranslation();

  const isValid =
    passwordMeetsAllRules(password, loginSettings, t) && password === confirmPassword;

  return (
    <>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (isValid && !loading) onSubmit(password);
        }}
        className="flex flex-col items-center gap-6 self-stretch p-6"
      >
        {errorMessage && <AuthErrorBanner message={errorMessage} />}
        <div className="flex flex-col items-start gap-6 self-stretch">
          <div className="flex w-full flex-col items-start gap-0 lg:gap-2">
            <PasswordField
              label={t("auth.password.label")}
              placeholder={t("auth.password.placeholder")}
              value={password}
              onChange={setPassword}
              onFocus={() => setPasswordTouched(true)}
              autoComplete="new-password"
            />
            {passwordTouched && (
              <PasswordStrengthChecklist password={password} settings={loginSettings} />
            )}
          </div>

          <PasswordField
            label={t("auth.password.confirmLabel")}
            placeholder={t("auth.password.confirmPlaceholder")}
            value={confirmPassword}
            onChange={setConfirmPassword}
            autoComplete="new-password"
          />
        </div>

        <AppButton
          type="submit"
          variant="primary"
          size="md"
          disabled={!isValid || loading}
          className="w-full"
        >
          {loading ? t("auth.pleaseWait") : (submitLabel ?? t("auth.setPassword.submit"))}
        </AppButton>
      </form>
    </>
  );
}
