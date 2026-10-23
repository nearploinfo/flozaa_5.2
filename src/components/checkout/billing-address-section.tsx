"use client";

import { useState } from "react";
import { FormFieldLabel } from "@/components/auth/shared/form-field-label";
import { SearchableSelect } from "@/components/account/searchable-select";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronRightIcon } from "@/components/icons/icons";
import { useTranslation } from "@/lib/i18n/translation-context";
import { useIsMobile } from "@/lib/use-is-mobile";
import { MobileBillingAddressSheet } from "@/components/checkout/mobile-billing-address-sheet";
import type { BillingAddressState } from "@/lib/checkout/use-billing-address";

const FIELD_CLASS =
  "w-full rounded-sm border border-form-field-border bg-bg-secondary px-4 py-2 text-base text-form-field-text placeholder:text-form-field-placeholder focus:border-form-field-focus focus:outline-none";
const SELECT_TRIGGER_CLASS =
  "flex w-full items-center justify-between gap-2 rounded-sm border border-form-field-border bg-bg-secondary px-4 py-2 text-base text-form-field-text";

/**
 * Billing address for the booking (place_order's billing_* params).
 *
 * Shown on every checkout because the API requires a billing choice on every
 * booking. The fields are the BILLING country's address fields, so switching
 * country swaps them; there's no map here because billing has no location.
 * The amounts never move with it — tax and fees come from the service address.
 */
export function BillingAddressSection({ billing }: { billing: BillingAddressState }) {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const [sheetOpen, setSheetOpen] = useState(false);

  const countryName = billing.countries.find(
    (country) => String(country.id) === billing.countryId
  )?.name;
  const regionName = billing.regions.find((region) => String(region.id) === billing.regionId)?.name;
  const summary = [regionName, countryName].filter(Boolean).join(", ");

  return (
    <div className="flex w-full flex-col items-start gap-4 rounded-2xl border border-border-default bg-bg-primary p-4 xl:p-6">
      <span className="text-lg font-medium text-text-primary">{t("checkoutPage.billing.title")}</span>

      {billing.canUseServiceAddress ? (
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={billing.sameAsService}
            onChange={(event) => billing.setSameAsService(event.target.checked)}
            className="size-4 rounded-sm border border-border-black accent-bg-brand"
          />
          <span className="text-sm text-text-secondary">{t("checkoutPage.billing.sameAsService")}</span>
        </label>
      ) : (
        <span className="text-sm text-text-secondary">{t("checkoutPage.billing.storeNotice")}</span>
      )}

      {!billing.sameAsService && isMobile && (
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          className="flex w-full items-center justify-between gap-2 rounded-lg bg-bg-secondary px-4 py-3 text-left"
        >
          <div className="flex flex-col items-start gap-1">
            <span className="text-sm text-text-primary">
              {summary || t("checkoutPage.billing.useDifferent")}
            </span>
            {billing.validationError && billing.countryId && (
              <span className="text-xs text-text-error">
                {billing.validationError.field === "country"
                  ? t("checkoutPage.billing.errors.country")
                  : billing.validationError.field === "region"
                    ? t("checkoutPage.billing.errors.region")
                    : t("checkoutPage.billing.errors.customField")}
              </span>
            )}
          </div>
          <ChevronRightIcon className="size-5 shrink-0 text-icon-primary" />
        </button>
      )}

      {!billing.sameAsService && isMobile && (
        <MobileBillingAddressSheet open={sheetOpen} onOpenChange={setSheetOpen} billing={billing} />
      )}

      {!billing.sameAsService && !isMobile && (
        <div className="flex w-full flex-col items-start gap-4">
          <div className="flex w-full flex-col items-start gap-4 sm:flex-row">
            <div className="flex w-full flex-col items-start gap-2">
              <FormFieldLabel label={t("checkoutPage.billing.country")} required />
              <SearchableSelect
                options={billing.countries.map((country) => ({
                  id: country.id,
                  name: country.name,
                  image: country.flag,
                }))}
                value={billing.countryId}
                onChange={billing.selectCountry}
                placeholder={t("checkoutPage.billing.countryPlaceholder")}
                searchPlaceholder={t("checkoutPage.billing.countrySearchPlaceholder")}
                noResultsLabel={t("checkoutPage.billing.countryNoResults")}
                triggerClassName={SELECT_TRIGGER_CLASS}
              />
            </div>
            <div className="flex w-full flex-col items-start gap-2">
              {/* Required only when the chosen country actually has regions —
                  place_order rejects a region that doesn't belong to the
                  country, and rejects a missing one when the country has them. */}
              <FormFieldLabel
                label={t("checkoutPage.billing.region")}
                required={billing.regions.length > 0}
              />
              <SearchableSelect
                options={billing.regions.map((region) => ({ id: region.id, name: region.name }))}
                value={billing.regionId}
                onChange={billing.setRegionId}
                placeholder={t("checkoutPage.billing.regionPlaceholder")}
                searchPlaceholder={t("checkoutPage.billing.regionSearchPlaceholder")}
                noResultsLabel={t("checkoutPage.billing.regionNoResults")}
                disabled={!billing.countryId || billing.regions.length === 0}
                triggerClassName={SELECT_TRIGGER_CLASS}
              />
            </div>
          </div>

          <div className="flex w-full flex-col items-start gap-4 sm:flex-row">
            <div className="flex w-full flex-col items-start gap-2">
              <FormFieldLabel label={t("checkoutPage.billing.mobile")} />
              <input
                type="tel"
                inputMode="numeric"
                value={billing.mobile}
                // Digits only — the API rejects anything else.
                onChange={(event) => billing.setMobile(event.target.value.replace(/\D/g, ""))}
                placeholder={t("checkoutPage.billing.mobilePlaceholder")}
                className={FIELD_CLASS}
              />
            </div>
            <div className="flex w-full flex-col items-start gap-2">
              <FormFieldLabel label={t("checkoutPage.billing.label")} />
              <input
                type="text"
                maxLength={50}
                value={billing.type}
                onChange={(event) => billing.setType(event.target.value)}
                placeholder={t("checkoutPage.billing.labelPlaceholder")}
                className={FIELD_CLASS}
              />
            </div>
          </div>

          {billing.fieldsStatus === "loading" &&
            Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="flex w-full flex-col items-start gap-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full rounded-sm" />
              </div>
            ))}

          {billing.fieldsStatus === "loaded" &&
            billing.fields.map((field) => (
              <div key={field.id} className="flex w-full flex-col items-start gap-2">
                <FormFieldLabel label={field.label} required={field.required === 1} />
                {field.field_type === "textarea" ? (
                  <textarea
                    rows={3}
                    value={billing.fieldValues[field.id] ?? ""}
                    onChange={(event) => billing.setFieldValue(field.id, event.target.value)}
                    placeholder={field.placeholder}
                    className={FIELD_CLASS}
                  />
                ) : (
                  <input
                    type={field.field_type === "number" ? "number" : "text"}
                    value={billing.fieldValues[field.id] ?? ""}
                    onChange={(event) => billing.setFieldValue(field.id, event.target.value)}
                    placeholder={field.placeholder}
                    className={FIELD_CLASS}
                  />
                )}
              </div>
            ))}

          {/* Only once the form has something in it — an untouched form
              shouldn't open with an error under it. */}
          {billing.validationError && billing.countryId && (
            <span className="text-sm text-text-error">
              {billing.validationError.field === "country"
                ? t("checkoutPage.billing.errors.country")
                : billing.validationError.field === "region"
                  ? t("checkoutPage.billing.errors.region")
                  : t("checkoutPage.billing.errors.customField")}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
