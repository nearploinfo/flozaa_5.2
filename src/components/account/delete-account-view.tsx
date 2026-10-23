"use client";

import { useState } from "react";
import { useRouter } from "next/router";
import { toast } from "sonner";
import { PageBreadcrumb } from "@/components/layout/page-breadcrumb";
import { AccountSidebar } from "@/components/account/account-sidebar";
import { AppButton } from "@/components/ui/app-button";
import { PasswordField } from "@/components/auth/shared/password-field";
import { deleteUserAccountApi } from "@/api/apiRoutes";
import { signOutFirebase } from "@/lib/firebase";
import { localizePath } from "@/lib/i18n/locale-path";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { clearAuth } from "@/store/slices/auth-slice";
import { useLoginSettings } from "@/lib/auth-settings";
import { isDemoAccount } from "@/lib/demo-mode";
import { useTranslation } from "@/lib/i18n/translation-context";
import ProfileLayout from "./ProfileLayout";

// Social logins have no password on file — backend skips the password check
// entirely when login_type is google/apple (see delete_user_account docs).
const PASSWORDLESS_LOGIN_TYPES = new Set(["google", "apple"]);

export function DeleteAccountView() {
  const { t, lang, defaultLocale } = useTranslation();
  const title = t("account.deleteAccount.confirm");
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const loginSettings = useLoginSettings();
  const requiresPassword =
    loginSettings.customer_password_login_enabled && !PASSWORDLESS_LOGIN_TYPES.has(user?.login_type ?? "");

  const [password, setPassword] = useState("");
  const [acknowledged, setAcknowledged] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isValid = (!requiresPassword || password.trim().length > 0) && acknowledged && !isDemoAccount(user);

  const handleCancel = () => router.push(localizePath("/profile", lang, defaultLocale));

  const handleDelete = async () => {
    if (isDemoAccount(user)) {
      toast.error(t("account.deleteAccount.demoNotAllowed"));
      return;
    }
    if (requiresPassword && !password.trim()) {
      toast.error(t("account.deleteAccount.passwordRequired"));
      return;
    }
    if (!acknowledged) {
      toast.error(t("account.deleteAccount.acknowledgeRequired"));
      return;
    }

    setDeleting(true);
    try {
      const result = await deleteUserAccountApi(requiresPassword ? { password } : undefined);
      if (result?.error) throw new Error(result.message);
      signOutFirebase();
      dispatch(clearAuth());
      toast.success(t("account.deleteAccount.success"));
      router.push(localizePath("/", lang, defaultLocale));
    } catch (error) {
      toast.error(error instanceof Error && error.message ? error.message : t("account.deleteAccount.failed"));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <PageBreadcrumb title={title} items={[{ label: title }]} />
      <ProfileLayout title={title}>
        <div className="flex w-full flex-1 flex-col items-start rounded-xl border border-border-default bg-bg-primary">
          <div className="flex w-full items-center justify-center gap-4 border-b border-border-default p-6 max-xl:hidden">
            <span className="flex-1 text-xl font-medium text-text-primary">{title}</span>
          </div>

          <div className="flex w-full flex-col items-start gap-6 p-6">
            <p className="w-full text-base text-text-primary">{t("account.deleteAccount.pageWarning")}</p>

            {requiresPassword && (
              <PasswordField
                label={t("account.deleteAccount.passwordLabel")}
                placeholder={t("account.deleteAccount.passwordPlaceholder")}
                value={password}
                onChange={setPassword}
                autoComplete="current-password"
              />
            )}

            <label className="flex w-full items-start gap-2.5">
              <input
                type="checkbox"
                checked={acknowledged}
                onChange={(event) => setAcknowledged(event.target.checked)}
                className="mt-0.5 size-6 shrink-0 rounded-sm border border-border-default p-0.5 accent-bg-brand"
              />
              <span className="flex-1 text-base text-text-primary">
                {t("account.deleteAccount.acknowledgeLabel")}
              </span>
            </label>

            <div className="flex w-full items-center justify-end gap-4">
              <AppButton
                variant="primary"
                size="md"
                disabled={!isValid || deleting}
                onClick={handleDelete}
              >
                {deleting ? t("auth.pleaseWait") : t("account.deleteAccount.submit")}
              </AppButton>
              <AppButton
                variant="secondary-outline"
                size="md"
                disabled={deleting}
                onClick={handleCancel}
              >
                {t("account.deleteAccount.cancel")}
              </AppButton>
            </div>
          </div>
        </div>
      </ProfileLayout>
    </>
  );
}
