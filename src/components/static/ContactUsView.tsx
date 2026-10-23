"use client";

import { useState } from "react";
import { toast } from "sonner";
import { PageBreadcrumb } from "@/components/layout/page-breadcrumb";
import MobileBreadcrum from "@/components/common/MobileBreadcrumb";
import { AppButton } from "@/components/ui/app-button";
import { Link } from "@/components/ui/locale-link";
import { FormFieldLabel } from "@/components/auth/shared/form-field-label";
import { CheckIcon, ClockIcon, MailIcon, MapPinAreaIcon, PhoneIcon } from "@/components/icons/icons";
import { contactUsApi } from "@/api/apiRoutes";
import { useAppSelector } from "@/store/hooks";
import { useHasHydrated } from "@/lib/use-has-hydrated";
import { useTranslation } from "@/lib/i18n/translation-context";

interface ContactGeneralSettings {
  phone?: string;
  support_email?: string;
  support_hours?: string;
  address?: string;
  translated_address?: string;
  company_map_location?: string;
}

const FIELD_CLASS =
  "w-full rounded-sm bg-bg-secondary px-4 py-2 text-base text-form-field-text outline outline-1 -outline-offset-1 outline-form-field-border placeholder:text-form-field-placeholder focus:outline-form-field-focus disabled:cursor-not-allowed disabled:opacity-60";

function InfoRow({
  icon: Icon,
  label,
  value,
  href,
  variant = "card",
}: {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  label: string;
  value: string;
  /** mailto:/tel: link — when set, the value is clickable */
  href?: string;
  /** "card": own bordered/bg-secondary box (lg+ grid). "plain": icon-only
   * chrome, for stacking inside one shared white card (mobile/tablet). */
  variant?: "card" | "plain";
}) {
  return (
    <div
      className={
        variant === "card"
          ? "flex w-full items-center gap-4 rounded-2xl border border-border-default bg-bg-secondary px-4 py-3"
          : "flex w-full items-center gap-4"
      }
    >
      <div
        className={
          variant === "card"
            ? "flex size-14 shrink-0 items-center justify-center rounded-xl border border-border-default bg-bg-primary"
            : "flex size-12 shrink-0 items-center justify-center rounded-3xl bg-bg-secondary"
        }
      >
        <Icon className="size-6 text-icon-primary" />
      </div>
      <div className="flex flex-1 flex-col gap-1">
        <span className="text-sm text-text-primary opacity-80">{label}</span>
        {href ? (
          <a
            href={href}
            className="line-clamp-2 text-sm font-medium text-text-primary hover:text-text-brand hover:underline"
          >
            {value}
          </a>
        ) : (
          <span className="line-clamp-2 text-sm font-medium text-text-primary">{value}</span>
        )}
      </div>
    </div>
  );
}

export function ContactUsView() {
  const { t } = useTranslation();
  // Settings are redux-persisted and rehydrate from localStorage before this
  // component's first client render — reading them straight away would make
  // that first render (has data) diverge from the SSR pass (no data yet),
  // causing a hydration mismatch. Wait a tick so both renders start empty.
  const hasHydrated = useHasHydrated();
  const persistedGeneralSettings = useAppSelector(
    (state) => state.settings.data?.general_settings
  ) as ContactGeneralSettings | undefined;
  const generalSettings = hasHydrated ? persistedGeneralSettings : undefined;

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const isFilled = name.trim() && email.trim() && subject.trim() && message.trim() && agreed;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!isFilled || submitting) return;
    setSubmitting(true);
    try {
      const response = await contactUsApi({ name, email, subject, message });
      if (response?.error === false) {
        toast.success(t("contactUs.success"));
        setName("");
        setEmail("");
        setSubject("");
        setMessage("");
        setAgreed(false);
      } else {
        toast.error(response?.message || t("contactUs.error"));
      }
    } catch {
      toast.error(t("contactUs.error"));
    } finally {
      setSubmitting(false);
    }
  };

  const address = generalSettings?.translated_address || generalSettings?.address;

  return (
    <div className="flex flex-col">
      <PageBreadcrumb title={t("contactUs.title")} items={[{ label: t("contactUs.title") }]} hideMobileBar />
      <MobileBreadcrum title={t("contactUs.title")} />

      <div className="w-full bg-bg-secondary lg:bg-bg-primary">
        <div className="container flex flex-col items-center gap-7 py-8 lg:py-16">
          <div className="flex w-full max-w-3xl flex-col items-center gap-2 text-center">
            <h1 className="text-xl font-medium text-text-primary lg:text-2xl">
              {t("contactUs.heading")}
            </h1>
            <p className="text-base text-text-secondary lg:text-lg">{t("contactUs.subtitle")}</p>
          </div>

          <div className="flex w-full flex-col gap-6 rounded-2xl">
            {/* lg+: each contact method its own bordered/gray card, side by side */}
            <div className="hidden w-full lg:grid lg:grid-cols-4 lg:gap-3">
              {generalSettings?.support_hours && (
                <InfoRow
                  icon={ClockIcon}
                  label={t("contactUs.openingHours")}
                  value={generalSettings.support_hours}
                />
              )}
              {generalSettings?.support_email && (
                <InfoRow
                  icon={MailIcon}
                  label={t("contactUs.email")}
                  value={generalSettings.support_email}
                  href={`mailto:${generalSettings.support_email}`}
                />
              )}
              {address && (
                <InfoRow icon={MapPinAreaIcon} label={t("contactUs.address")} value={address} />
              )}
              {generalSettings?.phone && (
                <InfoRow
                  icon={PhoneIcon}
                  label={t("contactUs.phoneNumber")}
                  value={generalSettings.phone}
                  href={`tel:${generalSettings.phone.replace(/\s+/g, "")}`}
                />
              )}
            </div>

            {/* max-lg: all four combined into one white card with dashed dividers */}
            <div className="flex w-full flex-col divide-y divide-dashed divide-border-default rounded-2xl bg-bg-primary p-4 lg:hidden">
              {generalSettings?.support_hours && (
                <div className="py-3 first:pt-0 last:pb-0">
                  <InfoRow
                    variant="plain"
                    icon={ClockIcon}
                    label={t("contactUs.openingHours")}
                    value={generalSettings.support_hours}
                  />
                </div>
              )}
              {generalSettings?.support_email && (
                <div className="py-3 first:pt-0 last:pb-0">
                  <InfoRow
                    variant="plain"
                    icon={MailIcon}
                    label={t("contactUs.email")}
                    value={generalSettings.support_email}
                    href={`mailto:${generalSettings.support_email}`}
                  />
                </div>
              )}
              {address && (
                <div className="py-3 first:pt-0 last:pb-0">
                  <InfoRow variant="plain" icon={MapPinAreaIcon} label={t("contactUs.address")} value={address} />
                </div>
              )}
              {generalSettings?.phone && (
                <div className="py-3 first:pt-0 last:pb-0">
                  <InfoRow
                    variant="plain"
                    icon={PhoneIcon}
                    label={t("contactUs.phoneNumber")}
                    value={generalSettings.phone}
                    href={`tel:${generalSettings.phone.replace(/\s+/g, "")}`}
                  />
                </div>
              )}
            </div>

            <div className="dashed-divider" />

            <div className="flex w-full flex-col gap-6 lg:flex-row lg:items-stretch">
              {generalSettings?.company_map_location && (
                <div className="w-full lg:w-[45%]">
                  <iframe
                    title={t("contactUs.map")}
                    src={generalSettings.company_map_location}
                    className="h-64 w-full rounded-xl border border-border-default lg:h-full"
                    loading="lazy"
                  />
                </div>
              )}

              <form
                onSubmit={handleSubmit}
                className="flex w-full flex-1 flex-col gap-4"
              >
                <div className="flex flex-col gap-1">
                  <h2 className="text-base font-medium text-text-primary">
                    {t("contactUs.formTitle")}
                  </h2>
                  <p className="text-sm text-text-secondary">{t("contactUs.formSubtitle")}</p>
                </div>

                <div className="flex flex-col gap-4 sm:flex-row">
                  <div className="flex w-full flex-col gap-2">
                    <FormFieldLabel label={t("contactUs.name")} required />
                    <input
                      type="text"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      placeholder={t("contactUs.namePlaceholder")}
                      className={FIELD_CLASS}
                    />
                  </div>
                  <div className="flex w-full flex-col gap-2">
                    <FormFieldLabel label={t("contactUs.email")} required />
                    <input
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder={t("contactUs.emailPlaceholder")}
                      className={FIELD_CLASS}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <FormFieldLabel label={t("contactUs.subject")} required />
                  <input
                    type="text"
                    value={subject}
                    onChange={(event) => setSubject(event.target.value)}
                    placeholder={t("contactUs.subjectPlaceholder")}
                    className={FIELD_CLASS}
                  />
                </div>

                <div className="flex h-44 flex-col gap-2">
                  <FormFieldLabel label={t("contactUs.message")} required />
                  <textarea
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    placeholder={t("contactUs.messagePlaceholder")}
                    className={`${FIELD_CLASS} flex-1 resize-none`}
                  />
                </div>

                <label className="flex items-start gap-2.5">
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={(event) => setAgreed(event.target.checked)}
                    className="peer sr-only"
                  />
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-sm p-0.5 outline outline-1 -outline-offset-1 outline-border-default peer-checked:bg-bg-brand peer-checked:outline-bg-brand">
                    {agreed && <CheckIcon className="size-4 text-text-inverse-light" />}
                  </span>
                  <span className="text-sm text-text-primary">
                    {t("contactUs.agreePrefix")}{" "}
                    <Link
                      href="/terms-and-conditions"
                      target="_blank"
                      className="text-text-brand underline"
                    >
                      {t("contactUs.termsOfServices")}
                    </Link>{" "}
                    {t("contactUs.and")}{" "}
                    <Link
                      href="/privacy-policy"
                      target="_blank"
                      className="text-text-brand underline"
                    >
                      {t("contactUs.privacyPolicy")}
                    </Link>
                  </span>
                </label>

                <AppButton
                  type="submit"
                  variant="secondary"
                  disabled={!isFilled || submitting}
                  className="self-start"
                >
                  {submitting ? t("contactUs.sending") : t("contactUs.submit")}
                </AppButton>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
