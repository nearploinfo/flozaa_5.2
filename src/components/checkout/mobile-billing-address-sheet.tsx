"use client";

import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer";
import { AppButton } from "@/components/ui/app-button";
import { Skeleton } from "@/components/ui/skeleton";
import { FormFieldLabel } from "@/components/auth/shared/form-field-label";
import { SearchableSelect } from "@/components/account/searchable-select";
import { useTranslation } from "@/lib/i18n/translation-context";
import type { BillingAddressState } from "@/lib/checkout/use-billing-address";

const FIELD_CLASS =
  "w-full rounded-lg bg-bg-secondary px-3 py-2 text-sm text-text-primary outline-none placeholder:text-text-tertiary";
const SELECT_TRIGGER_CLASS =
  "flex w-full items-center justify-between gap-2 rounded-lg bg-bg-secondary px-3 py-2 text-sm text-text-primary";

/** Mobile-only bottom sheet for the billing address form — the "not same as
 * service address" fields of billing-address-section.tsx, laid out as a
 * sheet like mobile-address-form-sheet.tsx instead of an always-expanded
 * inline form. Billing has no map/type-tabs: it's just the fields
 * use-billing-address.ts tracks, submitted with place_order. */
export function MobileBillingAddressSheet({
  open,
  onOpenChange,
  billing,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  billing: BillingAddressState;
}) {
  const { t } = useTranslation();

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh] bg-bg-primary">
        <div className="flex w-full flex-col items-center gap-2 px-4">
          <DrawerTitle className="w-full text-base font-medium text-text-primary">
            {t("checkoutPage.billing.title")}
          </DrawerTitle>
          <div className="dashed-divider" />
        </div>

        <div className="flex w-full flex-col items-start gap-4 overflow-y-auto px-4 pb-4">
          <div className="flex w-full flex-col items-start gap-1">
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

          <div className="flex w-full flex-col items-start gap-1">
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

          <div className="flex w-full flex-col items-start gap-1">
            <FormFieldLabel label={t("checkoutPage.billing.mobile")} />
            <input
              type="tel"
              inputMode="numeric"
              value={billing.mobile}
              onChange={(event) => billing.setMobile(event.target.value.replace(/\D/g, ""))}
              placeholder={t("checkoutPage.billing.mobilePlaceholder")}
              className={FIELD_CLASS}
            />
          </div>

          <div className="flex w-full flex-col items-start gap-1">
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

          {billing.fieldsStatus === "loading" &&
            Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="flex w-full flex-col items-start gap-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full rounded-lg" />
              </div>
            ))}

          {billing.fieldsStatus === "loaded" &&
            billing.fields.map((field) => (
              <div key={field.id} className="flex w-full flex-col items-start gap-1">
                <FormFieldLabel label={field.label} required={field.required === 1} />
                {field.field_type === "textarea" ? (
                  <textarea
                    rows={2}
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

        <div className="flex w-full items-center gap-3 bg-bg-primary p-4 shadow-[0px_2px_16px_0px_rgba(0,0,0,0.08)]">
          <AppButton
            variant="primary-outline"
            size="lg"
            className="flex-1 justify-center"
            onClick={() => onOpenChange(false)}
          >
            {t("common.close")}
          </AppButton>
          <AppButton
            variant="primary"
            size="lg"
            className="flex-1 justify-center"
            disabled={!billing.isValid}
            onClick={() => onOpenChange(false)}
          >
            {t("account.addresses.form.saveAddress")}
          </AppButton>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
