"use client";

import { useState } from "react";
import { TextField } from "@/components/auth/shared/text-field";
import { PhoneNumberField } from "@/components/auth/shared/phone-number-field";
import { PasswordField } from "@/components/auth/shared/password-field";
import {
  PasswordStrengthChecklist,
  passwordMeetsAllRules,
} from "@/components/auth/shared/password-strength-checklist";
import { AppButton } from "@/components/ui/app-button";
import type { SignupIdentity } from "@/components/auth/signup-flow-types";
import { useLoginSettings } from "@/lib/auth-settings";
import { useTranslation } from "@/lib/i18n/translation-context";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface NewProfileData {
  username: string;
  email: string;
  mobile: string;
  countryCode: string;
  companyName: string;
  password?: string;
}

/**
 * Shown once a brand-new account is verified (message_code 102/105) — the
 * Figma hand-off only had a bare password screen, but manage_user needs
 * name + both identifiers too, so this collects the rest before finalizing.
 * Google sign-ups (`hasPassword=false` from a `uid`) skip the password
 * fields entirely — the account authenticates via uid, not a password.
 */
export function CreateProfileStep({
  identity,
  initialUsername = "",
  showCompanyField = false,
  requiresPassword = true,
  loading = false,
  errorMessage,
  onSubmit,
}: {
  identity: SignupIdentity;
  initialUsername?: string;
  /** Adds an optional "Company Name" field between name and email — used by provider register. */
  showCompanyField?: boolean;
  requiresPassword?: boolean;
  loading?: boolean;
  errorMessage?: string | null;
  onSubmit: (data: NewProfileData) => void;
}) {
  const { t } = useTranslation();
  const loginSettings = useLoginSettings();

  const [username, setUsername] = useState(initialUsername);
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState(identity.type === "email" ? identity.value : "");
  const [phoneFullValue, setPhoneFullValue] = useState(
    identity.type === "phone" ? identity.countryCode + identity.value : ""
  );
  const [dialCode, setDialCode] = useState(identity.type === "phone" ? identity.countryCode : "");
  const [mobile, setMobile] = useState(identity.type === "phone" ? identity.value : "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordTouched, setPasswordTouched] = useState(false);

  // Email sign-ups already have an identifier; the phone number is a nice-to-have, not required.
  const phoneRequired = identity.type !== "email";

  const isValid =
    username.trim().length > 0 &&
    EMAIL_PATTERN.test(email) &&
    (!phoneRequired || mobile.replace(/\D/g, "").length >= 7) &&
    (!requiresPassword ||
      (passwordMeetsAllRules(password, loginSettings, t) && password === confirmPassword));

  return (
    <>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (!isValid || loading) return;
          onSubmit({
            username,
            email,
            mobile,
            countryCode: dialCode || "+91",
            companyName,
            password: requiresPassword ? password : undefined,
          });
        }}
        className="flex flex-col items-center gap-6 self-stretch p-6"
      >
        {errorMessage && (
          <p className="self-stretch text-sm text-form-field-error">{errorMessage}</p>
        )}

        <div className="flex flex-col items-start gap-6 self-stretch">
          <TextField
            label={t("auth.profile.name")}
            placeholder={t("auth.profile.namePlaceholder")}
            value={username}
            onChange={setUsername}
            autoFocus
            autoComplete="name"
          />

          {showCompanyField && (
            <TextField
              label={t("auth.profile.companyName")}
              placeholder={t("auth.profile.companyNamePlaceholder")}
              value={companyName}
              onChange={setCompanyName}
              required={false}
              autoComplete="organization"
            />
          )}

          <TextField
            label={t("auth.email.label")}
            type="email"
            placeholder={t("auth.email.placeholder")}
            value={email}
            onChange={setEmail}
            autoComplete="email"
            disabled={identity.type === "email"}
          />

          <PhoneNumberField
            value={phoneFullValue}
            onChange={(full, dial, national) => {
              setPhoneFullValue(full);
              setDialCode(dial);
              setMobile(national);
            }}
            disabled={identity.type === "phone"}
            required={phoneRequired}
          />

          {requiresPassword && (
            <>
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
            </>
          )}
        </div>

        <AppButton
          type="submit"
          variant="primary"
          size="md"
          disabled={!isValid || loading}
          className="w-full"
        >
          {loading ? t("auth.pleaseWait") : t("auth.profile.submit")}
        </AppButton>
      </form>
    </>
  );
}
