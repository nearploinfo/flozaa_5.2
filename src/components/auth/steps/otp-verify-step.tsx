"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { OtpInput } from "@/components/auth/shared/otp-input";
import { AuthErrorBanner } from "@/components/auth/shared/auth-error-banner";
import { useResendCountdown } from "@/components/auth/shared/use-resend-countdown";
import { AppButton } from "@/components/ui/app-button";
import { useTranslation } from "@/lib/i18n/translation-context";


/**
 * Generic 6-digit OTP verification screen — used for signup phone/email
 * verification, sign-in passwordless verification, and forgot-password
 * verification alike. Only the header copy and displayed identity differ.
 */
export function OtpVerifyStep({
  identityLabel,
  loading = false,
  errorMessage,
  onChangeIdentity,
  onContinue,
  onResend,
}: {
  identityLabel: string;
  loading?: boolean;
  errorMessage?: string | null;
  onChangeIdentity: () => void;
  onContinue: (otp: string) => void;
  onResend: () => void;
}) {
  const [otp, setOtp] = useState("");
  const { label, canResend, restart } = useResendCountdown(60);
  const { t } = useTranslation();

  const handleResend = () => {
    restart();
    onResend();
  };

  return (
    <>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (otp.length === 6 && !loading) onContinue(otp);
        }}
        className="flex flex-col items-center gap-6 self-stretch p-6"
      >
        {errorMessage && <AuthErrorBanner message={errorMessage} />}
        <div className="flex flex-col items-start gap-1 self-stretch">
          <p className="flex items-center gap-1 text-sm">
            <span className="text-text-brand">{identityLabel}</span>
            <button
              type="button"
              onClick={onChangeIdentity}
              aria-label={t("auth.otp.change")}
              className="flex items-center justify-center p-0.5 text-text-brand"
            >
              <Pencil className="size-3.5" />
            </button>
          </p>
        </div>

        <OtpInput value={otp} onChange={setOtp} />

        <div className="flex flex-col items-center gap-2 self-stretch">
          <AppButton
            type="submit"
            variant="primary"
            size="md"
            disabled={otp.length < 6 || loading}
            className="w-full"
          >
            {loading ? t("auth.pleaseWait") : t("auth.continue")}
          </AppButton>
          <p className="text-sm text-text-primary">
            {canResend ? (
              <AppButton
                variant="link"
                size="sm"
                disabled={loading}
                onClick={handleResend}
                className="h-auto p-0 font-medium text-text-brand hover:text-text-brand"
              >
                {t("auth.otp.resend")}
              </AppButton>
            ) : (
              <>
                {t("auth.otp.resendIn")} <span className="font-medium text-text-brand">{label}</span>
              </>
            )}
          </p>
        </div>
      </form>
    </>
  );
}
