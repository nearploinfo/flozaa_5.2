"use client";

import { useState } from "react";
import { useRouter } from "next/router";
import { toast } from "sonner";
import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer";
import { AppButton } from "@/components/ui/app-button";
import { PasswordField } from "@/components/auth/shared/password-field";
import { deleteUserAccountApi } from "@/api/apiRoutes";
import { signOutFirebase } from "@/lib/firebase";
import { localizePath } from "@/lib/i18n/locale-path";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { clearAuth } from "@/store/slices/auth-slice";
import { isDemoAccount } from "@/lib/demo-mode";
import { useTranslation } from "@/lib/i18n/translation-context";

// Social logins have no password on file — backend skips the password check
// entirely when login_type is google/apple (see delete_user_account docs).
const PASSWORDLESS_LOGIN_TYPES = new Set(["google", "apple"]);

/** Mobile counterpart to /delete-account (a full page on desktop) — same
 * password + acknowledgement + delete flow, as a bottom sheet instead. */
export function DeleteAccountSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t, lang, defaultLocale } = useTranslation();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const requiresPassword = !PASSWORDLESS_LOGIN_TYPES.has(user?.login_type ?? "");

  const [password, setPassword] = useState("");
  const [acknowledged, setAcknowledged] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isValid = (!requiresPassword || password.trim().length > 0) && acknowledged && !isDemoAccount(user);

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
      onOpenChange(false);
      router.push(localizePath("/", lang, defaultLocale));
    } catch (error) {
      toast.error(error instanceof Error && error.message ? error.message : t("account.deleteAccount.failed"));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Drawer
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          setPassword("");
          setAcknowledged(false);
        }
        onOpenChange(next);
      }}
    >
      <DrawerContent className="bg-bg-primary">
        <div className="flex flex-col items-start gap-2 px-4">
          <DrawerTitle className="self-stretch text-base font-medium text-text-primary">
            {t("account.deleteAccount.confirm")}
          </DrawerTitle>
          <div className="dashed-divider" />
        </div>

        <div className="flex flex-col items-start gap-4 px-4 pt-4">
          {requiresPassword && (
            <PasswordField
              label={t("account.deleteAccount.passwordLabel")}
              placeholder={t("account.deleteAccount.passwordPlaceholder")}
              value={password}
              onChange={setPassword}
              autoComplete="current-password"
            />
          )}

          <div className="w-full rounded-lg bg-bg-warning-subtle p-2">
            <p className="text-xs text-text-primary">{t("account.deleteAccount.pageWarning")}</p>
          </div>

          <label className="flex w-full items-center gap-1">
            <input
              type="checkbox"
              checked={acknowledged}
              onChange={(event) => setAcknowledged(event.target.checked)}
              className="size-5 shrink-0 rounded-sm border border-border-default accent-bg-brand"
            />
            <span className="flex-1 text-sm text-text-primary">
              {t("account.deleteAccount.acknowledgeLabel")}
            </span>
          </label>

          <div className="flex w-full items-start gap-3 pb-4">
            <AppButton
              variant="primary-outline"
              size="md"
              disabled={deleting}
              className="flex-1 justify-center border-border-error bg-bg-error-subtle text-text-error"
              onClick={() => onOpenChange(false)}
            >
              {t("account.deleteAccount.cancel")}
            </AppButton>
            <AppButton
              variant="primary"
              size="md"
              disabled={!isValid || deleting}
              className="flex-1 justify-center bg-button-destructive-bg text-button-destructive-text hover:bg-button-destructive-hover disabled:bg-button-destructive-bg disabled:text-button-destructive-text disabled:opacity-40"
              onClick={handleDelete}
            >
              {deleting ? t("auth.pleaseWait") : t("common.delete")}
            </AppButton>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
