"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { Camera, User, Mail, Phone } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { TextField } from "@/components/auth/shared/text-field";
import { PhoneNumberField } from "@/components/auth/shared/phone-number-field";
import { AppButton } from "@/components/ui/app-button";
import { updateUserApi } from "@/api/apiRoutes";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { updateUserData, type AuthUser } from "@/store/slices/auth-slice";
import { useTranslation } from "@/lib/i18n/translation-context";
import { useHasHydrated } from "@/lib/use-has-hydrated";
import { ProfileFormSkeleton } from "@/components/account/account-skeleton";
import { AvatarCropDialog } from "@/components/account/avatar-crop-dialog";

function ProfileFormFields({ user }: { user: AuthUser }) {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [username, setUsername] = useState(user.username ?? "");
  const [email, setEmail] = useState(user.email ?? "");
  // react-phone-input-2's `value` is digits-only (no leading "+"), but
  // country_code is stored/round-tripped with one (see PhoneNumberField's
  // onChange contract) — strip it here or the field renders blank.
  const [phoneFullValue, setPhoneFullValue] = useState(
    (user.country_code ?? "").replace("+", "") + (user.phone ?? "")
  );
  const [dialCode, setDialCode] = useState(user.country_code ?? "");
  const [mobile, setMobile] = useState(user.phone ?? "");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | undefined>(user.image);
  const [cropSource, setCropSource] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const loginType = user.login_type ?? (user.phone ? "phone" : "email");
  // Google accounts authenticate by email too — lock it the same as a plain
  // email login.
  const isEmailLogin = loginType === "email" || loginType === "google";
  const isPhoneLogin = loginType === "phone";

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setCropSource(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const result = await updateUserApi({
        username,
        email,
        mobile,
        country_code: dialCode || undefined,
        image: avatarFile ?? undefined,
      });
      if (result?.error) throw new Error(result.message);
      dispatch(
        updateUserData({
          username,
          email,
          phone: mobile,
          country_code: dialCode || undefined,
          ...(result?.data?.image ? { image: result.data.image } : {}),
        })
      );
      toast.success(t("account.profile.updateSuccess"));
    } catch {
      toast.error(t("account.profile.updateFailed"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {cropSource && (
        <AvatarCropDialog
          imageSrc={cropSource}
          onCancel={() => setCropSource(null)}
          onCropped={(file, previewUrl) => {
            setAvatarFile(file);
            setAvatarPreview(previewUrl);
            setCropSource(null);
          }}
        />
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleAvatarChange}
      />

      {/* Mobile */}
      <div className="flex w-full flex-col items-center gap-8 pb-28 xl:hidden">
        <div className="relative">
          <Avatar className="size-28">
            {avatarPreview && <AvatarImage src={avatarPreview} alt={username} />}
            <AvatarFallback className="bg-bg-brand text-3xl font-medium text-icon-inverse">
              {username.trim().charAt(0).toUpperCase() || "?"}
            </AvatarFallback>
          </Avatar>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            aria-label={t("account.profile.upload")}
            className="absolute right-0 bottom-1 flex size-9 items-center justify-center rounded-full border-2 border-bg-primary bg-button-primary-bg text-button-primary-text"
          >
            <Camera className="size-4" />
          </button>
        </div>

        <div className="flex w-full flex-col items-start gap-4">
          <TextField
            label={t("account.profile.name")}
            placeholder={t("auth.profile.namePlaceholder")}
            value={username}
            onChange={setUsername}
            autoComplete="name"
            leftIcon={User}
          />

          <TextField
            label={t("account.profile.mobileNumber")}
            placeholder={t("auth.phoneField.label")}
            value={mobile}
            onChange={(value) => {
              const national = value.replace(/\D/g, "");
              setMobile(national);
              setPhoneFullValue(dialCode.replace("+", "") + national);
            }}
            autoComplete="tel"
            disabled={isPhoneLogin}
            required={!isEmailLogin}
            leftIcon={Phone}
          />

          <TextField
            label={t("auth.email.label")}
            type="email"
            placeholder={t("auth.email.placeholder")}
            value={email}
            onChange={setEmail}
            autoComplete="email"
            disabled={isEmailLogin}
            required={!isPhoneLogin}
            leftIcon={Mail}
          />
        </div>

        <div className="fixed inset-x-0 bottom-0 border-t border-border-default bg-bg-primary p-4">
          <AppButton
            type="button"
            variant="primary"
            size="md"
            className="w-full"
            disabled={saving}
            onClick={handleSave}
          >
            {saving ? t("auth.pleaseWait") : t("account.profile.updateProfile")}
          </AppButton>
        </div>
      </div>

      {/* Desktop */}
      <div className="hidden w-full flex-col items-start gap-6 rounded-xl border border-border-default bg-bg-primary xl:flex">
        <div className="flex w-full items-center border-b border-border-default p-6">
          <h1 className="flex-1 text-xl font-medium text-text-primary">{t("account.myProfile")}</h1>
        </div>

        <div className="flex w-full flex-col items-start gap-6 p-6">
          <div className="flex w-full items-center gap-4 rounded-lg border border-border-default p-3">
            <Avatar className="size-16">
              {avatarPreview && <AvatarImage src={avatarPreview} alt={username} />}
              <AvatarFallback className="bg-bg-brand text-lg font-medium text-icon-inverse">
                {username.trim().charAt(0).toUpperCase() || "?"}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-1 flex-col items-start gap-1">
              <span className="w-full text-lg font-semibold text-text-primary">{username || "—"}</span>
              <span className="w-full text-sm text-text-secondary">{t("account.profile.uploadPicture")}</span>
            </div>
            <AppButton
              type="button"
              variant="secondary"
              size="md"
              leftIcon={Camera}
              onClick={() => fileInputRef.current?.click()}
            >
              {t("account.profile.upload")}
            </AppButton>
          </div>

          <div className="flex w-full flex-col items-start gap-4">
            <TextField
              label={t("account.profile.name")}
              placeholder={t("auth.profile.namePlaceholder")}
              value={username}
              onChange={setUsername}
              autoComplete="name"
            />

            <PhoneNumberField
              value={phoneFullValue}
              onChange={(full, dial, national) => {
                setPhoneFullValue(full);
                setDialCode(dial);
                setMobile(national);
              }}
              disabled={isPhoneLogin}
              required={!isEmailLogin}
            />

            <TextField
              label={t("auth.email.label")}
              type="email"
              placeholder={t("auth.email.placeholder")}
              value={email}
              onChange={setEmail}
              autoComplete="email"
              disabled={isEmailLogin}
              required={!isPhoneLogin}
            />
          </div>

          <div className="flex w-full flex-col items-end">
            <AppButton type="button" variant="primary" size="md" disabled={saving} onClick={handleSave}>
              {saving ? t("auth.pleaseWait") : t("account.profile.saveChanges")}
            </AppButton>
          </div>
        </div>
      </div>
    </>
  );
}

export function ProfileForm() {
  const hasHydrated = useHasHydrated();
  const user = useAppSelector((state) => state.auth.user);
  if (!hasHydrated) return <ProfileFormSkeleton />;
  if (!user) return null;
  // Keyed by id so a user that only becomes available after redux-persist's
  // async rehydration (e.g. a hard refresh on this page) still seeds the form
  // with real values instead of the empty defaults captured at first mount.
  return <ProfileFormFields key={user.id} user={user} />;
}
