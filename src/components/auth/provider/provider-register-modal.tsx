"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogPortal } from "@/components/ui/dialog";
import type { ProviderRegisterStep } from "@/components/auth/provider/provider-flow-types";
import { AuthLayout } from "@/components/auth/shared/auth-layout";
import { IdentifierEntryStep } from "@/components/auth/steps/identifier-entry-step";
import { OtpVerifyStep } from "@/components/auth/steps/otp-verify-step";
import { CreateProfileStep, type NewProfileData } from "@/components/auth/steps/create-profile-step";
import { ProviderSuccessStep } from "@/components/auth/provider/provider-success-step";
import { useProviderAuth } from "@/components/auth/provider/use-provider-auth";
import { getAuthErrorMessage, toMessageCode } from "@/components/auth/use-customer-auth";
import { useRecaptcha } from "@/components/auth/use-recaptcha";
import { useLoginSettings } from "@/lib/auth-settings";
import { useScrollLock } from "@/lib/use-scroll-lock";
import { usePartnerRegisterUrl, useProviderAppLinks } from "@/lib/become-provider";
import { useTranslation } from "@/lib/i18n/translation-context";

const RECAPTCHA_CONTAINER_ID = "provider-register-recaptcha-container";

function initialStep(loginSettings: ReturnType<typeof useLoginSettings>): ProviderRegisterStep {
  return loginSettings.phone_authentication_enabled ? { name: "phone" } : { name: "email" };
}

export function ProviderRegisterModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const loginSettings = useLoginSettings();
  const [step, setStep] = useState<ProviderRegisterStep>(() => initialStep(loginSettings));
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { verifyIdentity, sendOtp, verifyOtp, register } = useProviderAuth();
  const { getVerifier, clearRecaptcha } = useRecaptcha(RECAPTCHA_CONTAINER_ID);
  const partnerRegisterUrl = usePartnerRegisterUrl();
  const { appStoreUrl, playStoreUrl } = useProviderAppLinks();
  const { t } = useTranslation();
  useScrollLock(open);

  const handleClose = (next: boolean) => {
    if (!next) {
      setStep(initialStep(loginSettings));
      setErrorMessage(null);
      clearRecaptcha();
    }
    onOpenChange(next);
  };

  const goTo = (next: ProviderRegisterStep) => {
    setErrorMessage(null);
    setStep(next);
  };

  const handleIdentifierContinue = async (mode: "phone" | "email", value: string, dialCode?: string) => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const countryCode = dialCode ?? "+91";
      const verify = await verifyIdentity({ mode, value, countryCode });
      if (verify.error) throw new Error(verify.message);
      if (toMessageCode(verify.message_code) === 101 || toMessageCode(verify.message_code) === 104) {
        setErrorMessage(t("auth.provider.errors.alreadyRegistered"));
        return;
      }
      if (toMessageCode(verify.message_code) === 103 || toMessageCode(verify.message_code) === 106) {
        setErrorMessage(verify.message || t("auth.errors.deactivated"));
        return;
      }
      const authenticationMode = verify.authentication_mode ?? "sms_gateway";
      // Unlike verify_user (customer flow), verify_provider never sends the OTP
      // itself — resend_provider_otp (or the firebase client call) must always
      // be triggered explicitly here for a new provider.
      await sendOtp({
        mode,
        value,
        countryCode,
        authenticationMode,
        recaptchaVerifier: mode === "phone" && authenticationMode === "firebase" ? getVerifier() : undefined,
      });
      if (mode === "phone") {
        setStep({ name: "phone-otp", phone: value, countryCode, authenticationMode });
      } else {
        setStep({ name: "email-otp", email: value, authenticationMode });
      }
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(getAuthErrorMessage(error, t("auth.errors.generic"), t));
    } finally {
      setLoading(false);
    }
  };

  const handleOtpContinue = async (
    mode: "phone" | "email",
    value: string,
    countryCode: string,
    authenticationMode: "firebase" | "sms_gateway",
    otp: string
  ) => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const result = await verifyOtp({ mode, value, countryCode, otp, authenticationMode });
      if (result.error) throw new Error(result.message);
      setStep({
        name: "details",
        identity: mode === "phone" ? { type: "phone", value, countryCode } : { type: "email", value },
      });
    } catch (error) {
      setErrorMessage(getAuthErrorMessage(error, t("auth.errors.otpIncorrect"), t));
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async (
    mode: "phone" | "email",
    value: string,
    countryCode: string,
    authenticationMode: "firebase" | "sms_gateway"
  ) => {
    try {
      await sendOtp({
        mode,
        value,
        countryCode,
        authenticationMode,
        recaptchaVerifier: mode === "phone" && authenticationMode === "firebase" ? getVerifier() : undefined,
      });
    } catch (error) {
      setErrorMessage(getAuthErrorMessage(error, t("auth.errors.resendFailed"), t));
    }
  };

  const handleRegister = async (
    identity: { type: "phone"; value: string; countryCode: string } | { type: "email"; value: string },
    profile: NewProfileData
  ) => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const result = await register({
        username: profile.username,
        company_name: profile.companyName,
        password: profile.password,
        password_confirm: profile.password,
        email: profile.email || undefined,
        mobile: profile.mobile || undefined,
        country_code: profile.countryCode || undefined,
        login_type: identity.type,
      });
      if (result.error) throw new Error(result.message);
      setStep({ name: "success" });
    } catch (error) {
      setErrorMessage(getAuthErrorMessage(error, t("auth.errors.createAccountFailed"), t));
    } finally {
      setLoading(false);
    }
  };

  let headerTitle: string;
  let headerDescription: string | undefined;
  switch (step.name) {
    case "phone":
      headerTitle = t("auth.provider.phone.title");
      headerDescription = t("auth.provider.phone.description");
      break;
    case "phone-otp":
      headerTitle = t("auth.otpVerify.phone.title");
      headerDescription = t("auth.otpVerify.phone.description");
      break;
    case "email":
      headerTitle = t("auth.provider.email.title");
      headerDescription = t("auth.provider.email.description");
      break;
    case "email-otp":
      headerTitle = t("auth.otpVerify.email.title");
      headerDescription = t("auth.otpVerify.email.description");
      break;
    case "details":
      headerTitle = t("auth.profile.title");
      headerDescription = t("auth.profile.description");
      break;
    case "success":
      headerTitle = t("auth.provider.success.title");
      break;
  }

  return (
    <Dialog open={open} onOpenChange={handleClose} modal={false}>
      {open && <div className="fixed inset-0 z-[45] bg-black/10 backdrop-blur-xs" />}
      <DialogPortal>
        <div id={RECAPTCHA_CONTAINER_ID} className="fixed right-4 bottom-4 z-9999" />
      </DialogPortal>
      <DialogContent
        showCloseButton={false}
        onPointerDownOutside={(event) => event.preventDefault()}
        onInteractOutside={(event) => event.preventDefault()}
        className="w-[502px] max-w-full gap-0 overflow-hidden rounded-xl p-0 sm:max-w-none max-xl:fixed max-xl:inset-0 max-xl:top-0 max-xl:start-0 max-xl:h-dvh max-xl:w-screen max-xl:max-w-none max-xl:translate-x-0 max-xl:translate-y-0 max-xl:overflow-y-auto max-xl:rounded-none"
      >
        <AuthLayout title={headerTitle} description={headerDescription} onClose={() => handleClose(false)} stepKey={step.name}>
          {step.name === "phone" && (
            <IdentifierEntryStep
              mode="phone"
              variant="signup"
              showGoogle={false}
              loading={loading}
              errorMessage={errorMessage}
              onContinue={(value, dialCode) => handleIdentifierContinue("phone", value, dialCode)}
              onContinueWithGoogle={() => {}}
              onContinueWithOtherIdentifier={() => goTo({ name: "email" })}
            />
          )}

          {step.name === "phone-otp" && (
            <OtpVerifyStep
              identityLabel={`${step.countryCode} ${step.phone}`}
              loading={loading}
              errorMessage={errorMessage}
              onChangeIdentity={() => goTo({ name: "phone" })}
              onContinue={(otp) => handleOtpContinue("phone", step.phone, step.countryCode, step.authenticationMode, otp)}
              onResend={() => handleResendOtp("phone", step.phone, step.countryCode, step.authenticationMode)}
            />
          )}

          {step.name === "email" && (
            <IdentifierEntryStep
              mode="email"
              variant="signup"
              showGoogle={false}
              loading={loading}
              errorMessage={errorMessage}
              onContinue={(value) => handleIdentifierContinue("email", value)}
              onContinueWithGoogle={() => {}}
              onContinueWithOtherIdentifier={() => goTo({ name: "phone" })}
            />
          )}

          {step.name === "email-otp" && (
            <OtpVerifyStep
              identityLabel={step.email}
              loading={loading}
              errorMessage={errorMessage}
              onChangeIdentity={() => goTo({ name: "email" })}
              onContinue={(otp) => handleOtpContinue("email", step.email, "", step.authenticationMode, otp)}
              onResend={() => handleResendOtp("email", step.email, "", step.authenticationMode)}
            />
          )}

          {step.name === "details" && (
            <CreateProfileStep
              identity={step.identity}
              showCompanyField
              requiresPassword
              loading={loading}
              errorMessage={errorMessage}
              onSubmit={(profile) => handleRegister(step.identity, profile)}
            />
          )}

          {step.name === "success" && (
            <ProviderSuccessStep
              partnerRegisterUrl={partnerRegisterUrl}
              appStoreUrl={appStoreUrl}
              playStoreUrl={playStoreUrl}
            />
          )}
        </AuthLayout>
      </DialogContent>
    </Dialog>
  );
}
