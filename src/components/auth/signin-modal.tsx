"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogPortal } from "@/components/ui/dialog";
import type { SigninStep, SigninIdentity } from "@/components/auth/signin-flow-types";
import { AuthLayout } from "@/components/auth/shared/auth-layout";
import { IdentifierEntryStep } from "@/components/auth/steps/identifier-entry-step";
import { IdentifierPasswordStep } from "@/components/auth/steps/identifier-password-step";
import { OtpVerifyStep } from "@/components/auth/steps/otp-verify-step";
import { SetPasswordStep } from "@/components/auth/steps/set-password-step";
import { CreateProfileStep, type NewProfileData } from "@/components/auth/steps/create-profile-step";
import { useCustomerAuth, getAuthErrorMessage, toMessageCode } from "@/components/auth/use-customer-auth";
import { useRecaptcha } from "@/components/auth/use-recaptcha";
import { useLoginSettings } from "@/lib/auth-settings";
import { useScrollLock } from "@/lib/use-scroll-lock";
import { useTranslation } from "@/lib/i18n/translation-context";
import { DEMO_CREDENTIALS, useIsDemoMode } from "@/lib/demo-mode";

const RECAPTCHA_CONTAINER_ID = "signin-recaptcha-container";

function identityValue(identity: SigninIdentity): string {
  return identity.value;
}

function identityCountryCode(identity: SigninIdentity): string {
  return identity.type === "phone" ? identity.countryCode : "";
}

export function SigninModal({
  open,
  onOpenChange,
  onSwitchToSignUp,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSwitchToSignUp: () => void;
}) {
  const [step, setStep] = useState<SigninStep>({ name: "entry", mode: "email" });
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { verifyIdentity, sendOtp, verifyOtp, loginOrRegister, setPassword, googleSignIn } =
    useCustomerAuth();
  const { getVerifier, clearRecaptcha } = useRecaptcha(RECAPTCHA_CONTAINER_ID);
  const loginSettings = useLoginSettings();
  const { lang, t } = useTranslation();
  const isDemoMode = useIsDemoMode();
  useScrollLock(open);

  // demo_mode reviewers sign in with the fixed demo phone number (see
  // DEMO_CREDENTIALS below) — default straight to the phone tab instead of
  // making them switch off email first. isDemoMode is false until
  // redux-persist hydrates (see useIsDemoMode), so the initial useState
  // above can't read it yet — sync it once hydration resolves instead.
  useEffect(() => {
    if (!isDemoMode) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time sync once demo_mode resolves post-hydration, not derivable from props/state at render time
    setStep((prev) => (prev.name === "entry" && prev.mode === "email" ? { name: "entry", mode: "phone" } : prev));
  }, [isDemoMode]);

  const handleClose = (next: boolean) => {
    if (!next) {
      setStep({ name: "entry", mode: isDemoMode ? "phone" : "email" });
      setErrorMessage(null);
      clearRecaptcha();
    }
    onOpenChange(next);
  };

  const goTo = (next: SigninStep) => {
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
      if (toMessageCode(verify.message_code) === 102 || toMessageCode(verify.message_code) === 105) {
        // New Google account — no need to force them through a separate sign-up
        // flow, just collect the missing profile bits (name + phone) here.
        setStep({
          name: "profile",
          identity: { type: "email", value: google.email ?? "" },
          uid: google.uid,
          initialUsername: google.displayName ?? "",
        });
        return;
      }
      const result = await loginOrRegister({
        uid: google.uid,
        email: google.email,
        username: google.displayName,
        login_type: "google",
        language_code: lang,
      });
      if (result.error) throw new Error(result.message);
      toast.success(t("auth.success.loggedIn"));
      handleClose(false);
    } catch (error) {
      setErrorMessage(getAuthErrorMessage(error, t("auth.errors.googleFailed"), t));
    } finally {
      setLoading(false);
    }
  };

  const handleEntryContinue = async (mode: "phone" | "email", value: string, dialCode?: string) => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const countryCode = dialCode ?? "+91";
      const verify = await verifyIdentity({ mode, value, countryCode, passwordUpdate: "0", loginType: mode });
      if (verify.error) throw new Error(verify.message);
      if (toMessageCode(verify.message_code) === 103 || toMessageCode(verify.message_code) === 106) {
        setErrorMessage(verify.message || t("auth.errors.deactivated"));
        return;
      }
      const isNewAccount =
        toMessageCode(verify.message_code) === 102 || toMessageCode(verify.message_code) === 105;
      const identity: SigninIdentity =
        mode === "phone" ? { type: "phone", value, countryCode } : { type: "email", value };

      if (!isNewAccount && verify.has_password && loginSettings.customer_password_login_enabled) {
        setStep({ name: "password", identity });
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
      setStep({ name: "otp", identity, authenticationMode, purpose: isNewAccount ? "register" : "login" });
    } catch (error) {
      setErrorMessage(getAuthErrorMessage(error, t("auth.errors.generic"), t));
    } finally {
      setLoading(false);
    }
  };

  const handleOtpContinue = async (
    identity: SigninIdentity,
    authenticationMode: "firebase" | "sms_gateway",
    purpose: "login" | "register",
    otp: string
  ) => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const result = await verifyOtp({
        mode: identity.type,
        value: identityValue(identity),
        countryCode: identityCountryCode(identity),
        otp,
        authenticationMode,
        passwordUpdate: "0",
        loginType: identity.type,
      });
      if (result.error) throw new Error(result.message);

      if (purpose === "register") {
        // New account — collect name + password before calling manage_user.
        setStep({ name: "profile", identity });
        return;
      }

      // Only reached when the account had no password set (an account with one
      // goes through the "password" step at entry instead — see
      // handleEntryContinue). Password login is on — have them set one before
      // calling manage_user, mirroring the forgot-password reset flow: set the
      // password first (via reset_token/identity, no session needed yet), then
      // log in.
      if (loginSettings.customer_password_login_enabled) {
        setStep({ name: "set-password", identity, resetToken: result.reset_token });
        return;
      }

      // Password login is off — there's nothing to set a password for, log
      // straight in instead of prompting for one.
      const loginParams =
        identity.type === "phone"
          ? { mobile: identity.value, country_code: identity.countryCode, login_type: "phone", language_code: lang }
          : { email: identity.value, login_type: "email", language_code: lang };
      const login = await loginOrRegister(loginParams);
      if (login.error) throw new Error(login.message);
      toast.success(t("auth.success.loggedIn"));
      handleClose(false);
    } catch (error) {
      setErrorMessage(getAuthErrorMessage(error, t("auth.errors.otpIncorrect"), t));
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async (identity: SigninIdentity, authenticationMode: "firebase" | "sms_gateway") => {
    setLoading(true);
    try {
      await sendOtp({
        mode: identity.type,
        value: identityValue(identity),
        countryCode: identityCountryCode(identity),
        authenticationMode,
        loginType: identity.type,
        recaptchaVerifier:
          identity.type === "phone" && authenticationMode === "firebase" ? getVerifier() : undefined,
      });
    } catch (error) {
      setErrorMessage(getAuthErrorMessage(error, t("auth.errors.resendFailed"), t));
    } finally {
      setLoading(false);
    }
  };

  const handleSetPasswordSubmit = async (
    identity: SigninIdentity,
    resetToken: string | undefined,
    password: string
  ) => {
    setLoading(true);
    setErrorMessage(null);
    try {
      // No session yet at this point (manage_user hasn't run) — identify the
      // account the same way the forgot-password reset flow does: by
      // reset_token when OTP verify returned one, otherwise by identity.
      const params = resetToken
        ? { reset_token: resetToken, new_password: password, confirm_password: password, login_type: identity.type }
        : {
            email: identity.type === "email" ? identity.value : undefined,
            mobile: identity.type === "phone" ? identity.value : undefined,
            country_code: identity.type === "phone" ? identity.countryCode : undefined,
            new_password: password,
            confirm_password: password,
            login_type: identity.type,
          };
      const result = await setPassword(params);
      if (result.error) throw new Error(result.message);

      const loginParams =
        identity.type === "phone"
          ? { mobile: identity.value, country_code: identity.countryCode, login_type: "phone", language_code: lang }
          : { email: identity.value, login_type: "email", language_code: lang };
      const login = await loginOrRegister(loginParams);
      if (login.error) throw new Error(login.message);

      toast.success(t("auth.success.loggedIn"));
      handleClose(false);
    } catch (error) {
      setErrorMessage(getAuthErrorMessage(error, t("auth.errors.setPasswordFailed"), t));
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (identity: SigninIdentity) => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const verify = await verifyIdentity({
        mode: identity.type,
        value: identityValue(identity),
        countryCode: identityCountryCode(identity),
        passwordUpdate: "1",
        loginType: identity.type,
      });
      if (verify.error) throw new Error(verify.message);
      const authenticationMode = verify.authentication_mode ?? "sms_gateway";
      // verify_user already sends the OTP itself for sms_gateway/email — only
      // firebase phone auth still needs an explicit client-side trigger here.
      // Email never uses firebase — gate on identity type too so it can't
      // slip through.
      if (identity.type === "phone" && authenticationMode === "firebase") {
        await sendOtp({
          mode: identity.type,
          value: identityValue(identity),
          countryCode: identityCountryCode(identity),
          authenticationMode,
          loginType: identity.type,
          recaptchaVerifier: getVerifier(),
        });
      }
      setStep({ name: "forgot-otp", identity, authenticationMode });
    } catch (error) {
      setErrorMessage(getAuthErrorMessage(error, t("auth.errors.generic"), t));
    } finally {
      setLoading(false);
    }
  };

  const handleForgotOtpContinue = async (
    identity: SigninIdentity,
    authenticationMode: "firebase" | "sms_gateway",
    otp: string
  ) => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const result = await verifyOtp({
        mode: identity.type,
        value: identityValue(identity),
        countryCode: identityCountryCode(identity),
        otp,
        authenticationMode,
        passwordUpdate: "1",
        loginType: identity.type,
      });
      if (result.error) throw new Error(result.message);
      setStep({ name: "reset-password", identity, authenticationMode, resetToken: result.reset_token });
    } catch (error) {
      setErrorMessage(getAuthErrorMessage(error, t("auth.errors.otpIncorrect"), t));
    } finally {
      setLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (
    identity: SigninIdentity,
    resetToken: string | undefined,
    password: string
  ) => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const params = resetToken
        ? { reset_token: resetToken, new_password: password, confirm_password: password, login_type: identity.type }
        : {
            mobile: identity.type === "phone" ? identity.value : undefined,
            country_code: identity.type === "phone" ? identity.countryCode : undefined,
            new_password: password,
            confirm_password: password,
            login_type: identity.type,
          };
      const result = await setPassword(params);
      if (result.error) throw new Error(result.message);
      goTo({ name: "password", identity });
    } catch (error) {
      setErrorMessage(getAuthErrorMessage(error, t("auth.errors.resetPasswordFailed"), t));
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProfile = async (
    identity: SigninIdentity,
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
  let headerOnBack: (() => void) | undefined;
  let headerBackLabel: string | undefined;
  let showFooter = false;
  switch (step.name) {
    case "entry":
      headerTitle = step.mode === "phone" ? t("auth.signin.phone.title") : t("auth.signin.email.title");
      headerDescription =
        step.mode === "phone" ? t("auth.signin.phone.description") : t("auth.signin.email.description");
      showFooter = true;
      break;
    case "otp":
      headerTitle =
        step.identity.type === "phone" ? t("auth.otpVerify.phone.title") : t("auth.otpVerify.email.title");
      headerDescription =
        step.identity.type === "phone"
          ? t("auth.otpVerify.phone.description")
          : t("auth.otpVerify.email.description");
      headerOnBack = () => goTo({ name: "entry", mode: step.identity.type });
      break;
    case "password":
      headerTitle =
        step.identity.type === "phone" ? t("auth.signin.phone.title") : t("auth.signin.email.title");
      headerDescription =
        step.identity.type === "phone" ? t("auth.signin.phone.description") : t("auth.signin.email.description");
      showFooter = true;
      break;
    case "set-password":
      headerTitle = t("auth.setPassword.title");
      headerDescription = t("auth.setPassword.description");
      showFooter = true;
      break;
    case "profile":
      headerTitle = t("auth.profile.title");
      headerDescription = t("auth.profile.description");
      showFooter = true;
      break;
    case "forgot-otp":
      headerTitle =
        step.identity.type === "phone" ? t("auth.otpVerify.phone.title") : t("auth.otpVerify.email.title");
      headerDescription =
        step.identity.type === "phone"
          ? t("auth.otpVerify.phone.description")
          : t("auth.otpVerify.email.description");
      headerOnBack = () => goTo({ name: "entry", mode: step.identity.type });
      break;
    case "reset-password":
      headerTitle = t("auth.setPassword.resetTitle");
      headerDescription = t("auth.setPassword.resetDescription");
      headerOnBack = () => goTo({ name: "password", identity: step.identity });
      headerBackLabel = t("auth.forgotPassword.title");
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
        onBack={headerOnBack}
        backLabel={headerBackLabel}
        footer={showFooter}
        stepKey={step.name === "entry" ? `entry-${step.mode}` : step.name}
      >
        {step.name === "entry" && (
          <IdentifierEntryStep
            key={step.mode}
            mode={step.mode}
            loading={loading}
            errorMessage={errorMessage}
            initialNationalNumber={isDemoMode && step.mode === "phone" ? DEMO_CREDENTIALS.NATIONAL_NUMBER : ""}
            initialDialCode={isDemoMode && step.mode === "phone" ? DEMO_CREDENTIALS.DIAL_CODE : ""}
            onContinue={(value, dialCode) => handleEntryContinue(step.mode, value, dialCode)}
            onContinueWithGoogle={handleContinueWithGoogle}
            onContinueWithOtherIdentifier={() =>
              goTo({ name: "entry", mode: step.mode === "phone" ? "email" : "phone" })
            }
            bottomText={t("auth.signin.noAccount")}
            bottomLinkLabel={t("auth.signin.signUp")}
            onBottomLinkClick={onSwitchToSignUp}
          />
        )}

        {step.name === "otp" && (
          <OtpVerifyStep
            identityLabel={
              step.identity.type === "phone" ? `${step.identity.countryCode} ${step.identity.value}` : step.identity.value
            }
            loading={loading}
            errorMessage={errorMessage}
            onChangeIdentity={() => goTo({ name: "entry", mode: step.identity.type })}
            onContinue={(otp) => handleOtpContinue(step.identity, step.authenticationMode, step.purpose, otp)}
            onResend={() => handleResendOtp(step.identity, step.authenticationMode)}
          />
        )}

        {step.name === "password" && (
          <IdentifierPasswordStep
            mode={step.identity.type}
            initialIdentifier={step.identity.value}
            initialDialCode={step.identity.type === "phone" ? step.identity.countryCode : undefined}
            initialPassword={
              isDemoMode &&
              step.identity.type === "phone" &&
              step.identity.value === DEMO_CREDENTIALS.NATIONAL_NUMBER
                ? DEMO_CREDENTIALS.PASSWORD
                : ""
            }
            loading={loading}
            errorMessage={errorMessage}
            submitLabel={t("auth.signin.submit")}
            onContinue={async (identifierValue, password, dialCode) => {
              setLoading(true);
              setErrorMessage(null);
              try {
                const params =
                  step.identity.type === "phone"
                    ? { mobile: identifierValue, country_code: dialCode ?? "+91", password, login_type: "phone", language_code: lang }
                    : { email: identifierValue, password, login_type: "email", language_code: lang };
                const result = await loginOrRegister(params);
                if (result.error) throw new Error(result.message);
                toast.success(t("auth.success.loggedIn"));
                handleClose(false);
              } catch (error) {
                setErrorMessage(getAuthErrorMessage(error, t("auth.errors.incorrectPassword"), t));
              } finally {
                setLoading(false);
              }
            }}
            onForgotPassword={(identifierValue, dialCode) =>
              handleForgotPassword(
                step.identity.type === "phone"
                  ? { type: "phone", value: identifierValue, countryCode: dialCode ?? "+91" }
                  : { type: "email", value: identifierValue }
              )
            }
            onContinueWithGoogle={handleContinueWithGoogle}
            onContinueWithOtherIdentifier={() =>
              goTo({ name: "entry", mode: step.identity.type === "phone" ? "email" : "phone" })
            }
            onSwitchToSignUp={onSwitchToSignUp}
          />
        )}

        {step.name === "set-password" && (
          <SetPasswordStep
            loading={loading}
            errorMessage={errorMessage}
            onSubmit={(password) => handleSetPasswordSubmit(step.identity, step.resetToken, password)}
          />
        )}

        {step.name === "profile" && (
          <CreateProfileStep
            identity={step.identity}
            initialUsername={step.initialUsername}
            requiresPassword={!step.uid}
            loading={loading}
            errorMessage={errorMessage}
            onSubmit={(profile) => handleCreateProfile(step.identity, step.uid, profile)}
          />
        )}

        {step.name === "forgot-otp" && (
          <OtpVerifyStep
            identityLabel={
              step.identity.type === "phone" ? `${step.identity.countryCode} ${step.identity.value}` : step.identity.value
            }
            loading={loading}
            errorMessage={errorMessage}
            onChangeIdentity={() => goTo({ name: "entry", mode: step.identity.type })}
            onContinue={(otp) => handleForgotOtpContinue(step.identity, step.authenticationMode, otp)}
            onResend={() => handleResendOtp(step.identity, step.authenticationMode)}
          />
        )}

        {step.name === "reset-password" && (
          <SetPasswordStep
            submitLabel={t("auth.setPassword.resetSubmit")}
            loading={loading}
            errorMessage={errorMessage}
            onSubmit={(password) => handleResetPasswordSubmit(step.identity, step.resetToken, password)}
          />
        )}
      </AuthLayout>
      </DialogContent>
    </Dialog>
  );
}
