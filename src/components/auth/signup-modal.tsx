"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogPortal } from "@/components/ui/dialog";
import type { SignupStep } from "@/components/auth/signup-flow-types";
import { AuthLayout } from "@/components/auth/shared/auth-layout";
import { RegistrationOptionsStep } from "@/components/auth/steps/registration-options-step";
import { IdentifierEntryStep } from "@/components/auth/steps/identifier-entry-step";
import { OtpVerifyStep } from "@/components/auth/steps/otp-verify-step";
import { CreateProfileStep, type NewProfileData } from "@/components/auth/steps/create-profile-step";
import { useCustomerAuth, getAuthErrorMessage, toMessageCode } from "@/components/auth/use-customer-auth";
import { useRecaptcha } from "@/components/auth/use-recaptcha";
import { useLoginSettings } from "@/lib/auth-settings";
import { useScrollLock } from "@/lib/use-scroll-lock";
import { useTranslation } from "@/lib/i18n/translation-context";

const RECAPTCHA_CONTAINER_ID = "signup-recaptcha-container";

/**
 * Sign-up flow shell — owns step-to-step transitions and all API calls; the
 * step components stay dumb/reusable (render + report a decision upward).
 */
export function SignupModal({
  open,
  onOpenChange,
  onSwitchToSignIn,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSwitchToSignIn: () => void;
}) {
  const [step, setStep] = useState<SignupStep>({ name: "options" });
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { verifyIdentity, sendOtp, verifyOtp, loginOrRegister, googleSignIn } = useCustomerAuth();
  const { getVerifier, clearRecaptcha } = useRecaptcha(RECAPTCHA_CONTAINER_ID);
  const loginSettings = useLoginSettings();
  const { t } = useTranslation();
  useScrollLock(open);

  const handleClose = (next: boolean) => {
    if (!next) {
      setStep({ name: "options" });
      setErrorMessage(null);
      clearRecaptcha();
    }
    onOpenChange(next);
  };

  const goTo = (next: SignupStep) => {
    setErrorMessage(null);
    setStep(next);
  };

  const handleContinueWithGoogle = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const google = await googleSignIn();
      const verify = await verifyIdentity({
        mode: "email",
        value: google.email ?? "",
        countryCode: "",
        passwordUpdate: "0",
        loginType: "google",
        uid: google.uid,
      });
      if (verify.error) throw new Error(verify.message);
      if (toMessageCode(verify.message_code) === 103 || toMessageCode(verify.message_code) === 106) {
        setErrorMessage(verify.message);
        return;
      }
      if (toMessageCode(verify.message_code) === 101 || toMessageCode(verify.message_code) === 104) {
        setErrorMessage(t("auth.errors.accountExistsGoogle"));
        return;
      }
      // New Google account — manage_user still needs a phone number, so
      // route through the same profile-completion screen as OTP signup.
      setStep({
        name: "profile",
        identity: { type: "email", value: google.email ?? "" },
        uid: google.uid,
        initialUsername: google.displayName ?? "",
      });
    } catch (error) {
      setErrorMessage(getAuthErrorMessage(error, t("auth.errors.googleFailed"), t));
    } finally {
      setLoading(false);
    }
  };

  const handleIdentifierContinue = async (mode: "phone" | "email", value: string, dialCode?: string) => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const countryCode = dialCode ?? "+91";
      const verify = await verifyIdentity({ mode, value, countryCode, passwordUpdate: "0", loginType: mode });
      if (verify.error) throw new Error(verify.message);
      if (
        toMessageCode(verify.message_code) === 101 ||
        toMessageCode(verify.message_code) === 104
      ) {
        setErrorMessage(t("auth.errors.accountExists"));
        return;
      }
      if (toMessageCode(verify.message_code) === 103 || toMessageCode(verify.message_code) === 106) {
        setErrorMessage(verify.message || t("auth.errors.deactivated"));
        return;
      }
      const authenticationMode = verify.authentication_mode ?? "sms_gateway";
      // verify_user already sends the OTP itself for sms_gateway/email — only
      // firebase phone auth still needs an explicit client-side trigger here.
      // Email never uses firebase — gate on mode too so it can't slip through.
      if (mode === "phone" && authenticationMode === "firebase") {
        await sendOtp({
          mode,
          value,
          countryCode,
          authenticationMode,
          loginType: mode,
          recaptchaVerifier: getVerifier(),
        });
      }
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
      const result = await verifyOtp({
        mode,
        value,
        countryCode,
        otp,
        authenticationMode,
        passwordUpdate: "0",
        loginType: mode,
      });
      if (result.error) throw new Error(result.message);
      setStep({
        name: "profile",
        identity:
          mode === "phone" ? { type: "phone", value, countryCode } : { type: "email", value },
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
        loginType: mode,
        recaptchaVerifier: mode === "phone" && authenticationMode === "firebase" ? getVerifier() : undefined,
      });
    } catch (error) {
      setErrorMessage(getAuthErrorMessage(error, t("auth.errors.resendFailed"), t));
    }
  };

  const handleCreateProfile = async (
    identity: { type: "phone"; value: string; countryCode: string } | { type: "email"; value: string },
    uid: string | undefined,
    profile: NewProfileData
  ) => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const result = await loginOrRegister({
        username: profile.username,
        email: profile.email,
        mobile: profile.mobile,
        country_code: profile.countryCode,
        password: profile.password,
        login_type: uid ? "google" : identity.type,
        uid,
      });
      if (result.error) throw new Error(result.message);
      toast.success(t("auth.success.accountCreated"));
      handleClose(false);
    } catch (error) {
      setErrorMessage(getAuthErrorMessage(error, t("auth.errors.createAccountFailed"), t));
    } finally {
      setLoading(false);
    }
  };

  let headerTitle: string;
  let headerDescription: string | undefined;
  let showFooter = false;
  switch (step.name) {
    case "options":
      headerTitle = t("auth.registrationOptions.title");
      break;
    case "phone":
      headerTitle = t("auth.signup.phone.title");
      headerDescription = t("auth.signup.phone.description");
      showFooter = true;
      break;
    case "phone-otp":
      headerTitle = t("auth.otpVerify.phone.title");
      headerDescription = t("auth.otpVerify.phone.description");
      break;
    case "email":
      headerTitle = t("auth.signup.email.title");
      headerDescription = t("auth.signup.email.description");
      showFooter = true;
      break;
    case "email-otp":
      headerTitle = t("auth.otpVerify.email.title");
      headerDescription = t("auth.otpVerify.email.description");
      break;
    case "profile":
      headerTitle = t("auth.profile.title");
      headerDescription = t("auth.profile.description");
      showFooter = true;
      break;
  }

  return (
    <Dialog open={open} onOpenChange={handleClose} modal={false}>
      {/*
        Radix skips rendering its own backdrop when modal={false} (which we
        need — see comment below), so this replaces it manually. Must sit
        above the sticky header (z-40) so it isn't left unblurred, and below
        the reCAPTCHA container (z-9999) so the challenge iframe stays
        clickable.
      */}
      {open && <div className="fixed inset-0 z-[45] bg-black/10 backdrop-blur-xs" />}
      {/*
        Rendered in Radix's own Portal (so it stays inside the pointer-events
        scope Radix grants the open dialog) but as a sibling of DialogContent,
        not a descendant — DialogContent's open/close scale-transform creates a
        new CSS stacking context that otherwise traps the fixed-position
        reCAPTCHA challenge iframe behind the overlay and makes it unclickable.
      */}
      <DialogPortal>
        <div id={RECAPTCHA_CONTAINER_ID} className="fixed right-4 bottom-4 z-9999" />
      </DialogPortal>
      <DialogContent
        showCloseButton={false}
        onPointerDownOutside={(event) => event.preventDefault()}
        onInteractOutside={(event) => event.preventDefault()}
        className="w-[502px] max-w-full gap-0 overflow-hidden rounded-xl p-0 sm:max-w-none max-xl:fixed max-xl:inset-0 max-xl:top-0 max-xl:start-0 max-xl:h-dvh max-xl:w-screen max-xl:max-w-none max-xl:translate-x-0 max-xl:translate-y-0 max-xl:overflow-y-auto max-xl:rounded-none"
      >
      <AuthLayout
        title={headerTitle}
        description={headerDescription}
        onClose={() => handleClose(false)}
        footer={showFooter}
        stepKey={step.name}
      >
        {step.name === "options" && (
          <RegistrationOptionsStep
            loading={loading}
            errorMessage={errorMessage}
            onContinueWithGoogle={handleContinueWithGoogle}
            onContinueWithPhone={() => goTo({ name: "phone" })}
            onContinueWithEmail={() => goTo({ name: "email" })}
            onSwitchToSignIn={onSwitchToSignIn}
          />
        )}

        {step.name === "phone" && (
          <IdentifierEntryStep
            mode="phone"
            variant="signup"
            loading={loading}
            errorMessage={errorMessage}
            onContinue={(value, dialCode) => handleIdentifierContinue("phone", value, dialCode)}
            onContinueWithGoogle={handleContinueWithGoogle}
            onContinueWithOtherIdentifier={() => goTo({ name: "email" })}
            bottomText={t("auth.signup.haveAccount")}
            bottomLinkLabel={t("auth.signup.signIn")}
            onBottomLinkClick={onSwitchToSignIn}
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
            loading={loading}
            errorMessage={errorMessage}
            onContinue={(value) => handleIdentifierContinue("email", value)}
            onContinueWithGoogle={handleContinueWithGoogle}
            onContinueWithOtherIdentifier={() => goTo({ name: "phone" })}
            bottomText={t("auth.signup.haveAccount")}
            bottomLinkLabel={t("auth.signup.signIn")}
            onBottomLinkClick={onSwitchToSignIn}
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

        {step.name === "profile" && (
          <CreateProfileStep
            identity={step.identity}
            initialUsername={step.initialUsername}
            requiresPassword={!step.uid && loginSettings.customer_password_login_enabled}
            loading={loading}
            errorMessage={errorMessage}
            onSubmit={(profile) => handleCreateProfile(step.identity, step.uid, profile)}
          />
        )}
      </AuthLayout>
      </DialogContent>
    </Dialog>
  );
}
