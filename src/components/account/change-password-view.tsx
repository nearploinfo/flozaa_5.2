"use client";

import { useState } from "react";
import { toast } from "sonner";
import { PageBreadcrumb } from "@/components/layout/page-breadcrumb";
import { AppButton } from "@/components/ui/app-button";
import { PasswordField } from "@/components/auth/shared/password-field";
import {
  PasswordStrengthChecklist,
  passwordMeetsAllRules,
} from "@/components/auth/shared/password-strength-checklist";
import { useCustomerAuth, getAuthErrorMessage } from "@/components/auth/use-customer-auth";
import { useLoginSettings } from "@/lib/auth-settings";
import { useAppSelector } from "@/store/hooks";
import { useHasHydrated } from "@/lib/use-has-hydrated";
import { useTranslation } from "@/lib/i18n/translation-context";
import ProfileLayout from "./ProfileLayout";

export function ChangePasswordView() {
  const { t } = useTranslation();
  const title = t("account.changePassword.title");
  const hasHydrated = useHasHydrated();
  const user = useAppSelector((state) => state.auth.user);
  const { setPassword } = useCustomerAuth();
  const loginSettings = useLoginSettings();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Google accounts have no password to change — gate access the same way
  // the sidebar link is gated (see account-sidebar.tsx).
  const isGoogleAccount = hasHydrated && user?.login_type === "google";

  const isValid =
    currentPassword.trim().length > 0 &&
    passwordMeetsAllRules(newPassword, loginSettings, t) &&
    newPassword === confirmPassword;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (loading) return;
    if (!isValid) {
      toast.error(t("account.changePassword.mobile.invalidForm"));
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    try {
      const loginType = user?.login_type ?? (user?.mobile ? "phone" : "email");
      const result = await setPassword({
        old_password: currentPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
        login_type: loginType,
      });
      if (result.error) throw new Error(result.message);
      toast.success(t("account.changePassword.success"));
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordTouched(false);
    } catch (error) {
      setErrorMessage(getAuthErrorMessage(error, t("account.changePassword.failed"), t));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageBreadcrumb title={title} items={[{ label: title }]} />
      <ProfileLayout title={title}>
        {isGoogleAccount ? (
          <div className="flex w-full flex-col items-center gap-2 py-16 text-center md:rounded-xl md:border md:border-border-default md:bg-bg-primary md:p-6">
            <span className="text-base text-text-secondary">
              {t("account.changePassword.notAvailableGoogle")}
            </span>
          </div>
        ) : (
          <>
            {/* Mobile */}
            <form onSubmit={handleSubmit} className="flex w-full flex-col items-start gap-4 pb-28 xl:hidden">
              {errorMessage && (
                <p className="self-stretch text-sm text-form-field-error">{errorMessage}</p>
              )}

              <PasswordField
                label={t("account.changePassword.currentPasswordLabel")}
                placeholder={t("account.changePassword.mobile.currentPlaceholder")}
                value={currentPassword}
                onChange={setCurrentPassword}
                autoComplete="current-password"
                background="primary"
              />

              <div className="flex w-full flex-col items-start gap-2">
                <PasswordField
                  label={t("account.changePassword.newPasswordLabel")}
                  placeholder={t("account.changePassword.mobile.newPlaceholder")}
                  value={newPassword}
                  onChange={setNewPassword}
                  onFocus={() => setPasswordTouched(true)}
                  autoComplete="new-password"
                  background="primary"
                />
                {passwordTouched && (
                  <PasswordStrengthChecklist password={newPassword} settings={loginSettings} />
                )}
              </div>

              <PasswordField
                label={t("account.changePassword.mobile.confirmLabel")}
                placeholder={t("account.changePassword.mobile.confirmPlaceholder")}
                value={confirmPassword}
                onChange={setConfirmPassword}
                autoComplete="new-password"
                background="primary"
              />

              <div className="fixed inset-x-0 bottom-0 border-t border-border-default bg-bg-primary p-4">
                <AppButton type="submit" variant="primary" size="md" className="w-full" disabled={loading}>
                  {loading ? t("auth.pleaseWait") : t("account.changePassword.mobile.cta")}
                </AppButton>
              </div>
            </form>

            {/* Desktop */}
            <div className="hidden w-full flex-1 flex-col items-start rounded-xl border border-border-default bg-bg-primary xl:flex">
              <div className="flex w-full items-center justify-center gap-4 border-b border-border-default p-6">
                <span className="flex-1 text-xl font-medium text-text-primary">{title}</span>
              </div>

              <form onSubmit={handleSubmit} className="flex w-full flex-col items-start gap-6 p-6">
                {errorMessage && (
                  <p className="self-stretch text-sm text-form-field-error">{errorMessage}</p>
                )}

                <PasswordField
                  label={t("account.changePassword.currentPasswordLabel")}
                  placeholder={t("account.changePassword.currentPasswordPlaceholder")}
                  value={currentPassword}
                  onChange={setCurrentPassword}
                  autoComplete="current-password"
                />

                <div className="flex w-full flex-col items-start gap-2">
                  <PasswordField
                    label={t("account.changePassword.newPasswordLabel")}
                    placeholder={t("auth.password.placeholder")}
                    value={newPassword}
                    onChange={setNewPassword}
                    onFocus={() => setPasswordTouched(true)}
                    autoComplete="new-password"
                  />
                  {passwordTouched && (
                    <PasswordStrengthChecklist password={newPassword} settings={loginSettings} />
                  )}
                </div>

                <PasswordField
                  label={t("account.changePassword.confirmPasswordLabel")}
                  placeholder={t("auth.password.confirmPlaceholder")}
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  autoComplete="new-password"
                />

                <div className="flex w-full flex-col items-end">
                  <AppButton type="submit" variant="primary" size="md" disabled={!isValid || loading}>
                    {loading ? t("auth.pleaseWait") : title}
                  </AppButton>
                </div>
              </form>
            </div>
          </>
        )}
      </ProfileLayout>
    </>
  );
}
