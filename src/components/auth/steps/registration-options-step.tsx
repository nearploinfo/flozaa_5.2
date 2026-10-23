"use client";

import { PhoneIcon, MailIcon, GoogleIcon } from "@/components/icons/icons";
import { AuthMethodButton } from "@/components/auth/shared/auth-method-button";
import { AppButton } from "@/components/ui/app-button";
import { useLoginSettings } from "@/lib/auth-settings";
import { useTranslation } from "@/lib/i18n/translation-context";

export function RegistrationOptionsStep({
  loading = false,
  errorMessage,
  onContinueWithGoogle,
  onContinueWithPhone,
  onContinueWithEmail,
  onSwitchToSignIn,
}: {
  loading?: boolean;
  errorMessage?: string | null;
  onContinueWithGoogle: () => void;
  onContinueWithPhone: () => void;
  onContinueWithEmail: () => void;
  onSwitchToSignIn: () => void;
}) {
  const loginSettings = useLoginSettings();
  const { t } = useTranslation();

  return (
    <>
      <div className="flex flex-col items-center gap-4 self-stretch p-6">
        {errorMessage && (
          <p className="self-stretch text-sm text-form-field-error">{errorMessage}</p>
        )}
        <div className="flex flex-col items-start gap-0.5 self-stretch">
          <p className="self-stretch text-base font-medium text-text-primary">
            {t("auth.registrationOptions.heading")}
          </p>
          <p className="self-stretch text-sm text-text-secondary">
            {t("auth.registrationOptions.description")}
          </p>
        </div>

        <div className="flex flex-col items-start gap-3 self-stretch">
          {loginSettings.social_authentication_enabled && (
            <AuthMethodButton icon={GoogleIcon} label={t("auth.methods.google")} disabled={loading} onClick={onContinueWithGoogle} />
          )}
          {loginSettings.phone_authentication_enabled && (
            <AuthMethodButton icon={PhoneIcon} label={t("auth.methods.phone")} onClick={onContinueWithPhone} />
          )}
          {loginSettings.email_authentication_enabled && (
            <AuthMethodButton icon={MailIcon} label={t("auth.methods.email")} onClick={onContinueWithEmail} />
          )}
        </div>

        <p className="text-sm text-text-primary">
          {t("auth.registrationOptions.haveAccount")}{" "}
          <AppButton
            variant="link"
            size="sm"
            onClick={onSwitchToSignIn}
            className="h-auto p-0 font-medium text-text-brand hover:text-text-brand"
          >
            {t("auth.registrationOptions.signIn")}
          </AppButton>
        </p>
      </div>
    </>
  );
}
