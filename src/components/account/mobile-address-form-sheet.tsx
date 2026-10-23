"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer";
import { AppButton } from "@/components/ui/app-button";
import { Skeleton } from "@/components/ui/skeleton";
import { FormFieldLabel } from "@/components/auth/shared/form-field-label";
import { PhoneNumberField } from "@/components/auth/shared/phone-number-field";
import { AddressHomeIcon, AddressOfficeIcon, AddressOtherIcon } from "@/components/icons/icons";
import { SearchableSelect } from "@/components/account/searchable-select";
import { useCountries } from "@/lib/use-countries";
import { useRegions } from "@/lib/use-regions";
import { resolveLocationFromBoundaries } from "@/lib/resolve-country";
import {
  addAddressApi,
  getAddressCustomFieldsApi,
  normalizeAddressType,
  type AddressApi,
  type AddressCustomFieldApi,
  type AddressCustomFieldsResponse,
  type AddressType,
} from "@/api/apiRoutes";
import { useTranslation } from "@/lib/i18n/translation-context";

const TYPE_OPTIONS: { value: AddressType; icon: typeof AddressHomeIcon }[] = [
  { value: "home", icon: AddressHomeIcon },
  { value: "office", icon: AddressOfficeIcon },
  { value: "other", icon: AddressOtherIcon },
];

/** Mobile-only bottom sheet — step 2 of the add/edit address flow, after
 * MobileAddressLocationSheet resolves a lat/lng. Same custom-fields/type/
 * default logic as address-form-dialog.tsx's desktop Dialog, just laid out
 * as a sheet with a phone field that has a country-code picker. */
export function MobileAddressFormSheet({
  open,
  onOpenChange,
  address,
  mapCenter,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** undefined/null = add mode; a loaded address = edit mode. */
  address?: AddressApi | null;
  mapCenter: { lat: number; lng: number } | null;
  onSaved: () => void;
}) {
  const { t } = useTranslation();

  const typeLabel: Record<AddressType, string> = {
    home: t("account.addresses.typeHome"),
    office: t("account.addresses.typeOffice"),
    other: t("account.addresses.typeOther"),
  };

  const [type, setType] = useState<AddressType>("home");
  const [phone, setPhone] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [customFields, setCustomFields] = useState<AddressCustomFieldApi[]>([]);
  const [customFieldValues, setCustomFieldValues] = useState<Record<number, string>>({});
  const [loadingFields, setLoadingFields] = useState(false);
  const [saving, setSaving] = useState(false);

  // Optional — left unset lets the backend infer both from mapCenter.
  const [countryId, setCountryId] = useState<string>("");
  const [regionId, setRegionId] = useState<string>("");
  const [autoResolvedCountryId, setAutoResolvedCountryId] = useState<string | null>(null);
  const [autoResolvedRegionId, setAutoResolvedRegionId] = useState<string | null>(null);
  const { countries } = useCountries();
  const { regions } = useRegions(countryId || null);

  useEffect(() => {
    if (!open) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- re-seeding form state from the `address` prop each time the sheet opens
    setType(address ? normalizeAddressType(address.type) : "home");
    // eslint-disable-next-line react-hooks/set-state-in-effect -- see above
    setPhone(address?.mobile ?? "");
    // eslint-disable-next-line react-hooks/set-state-in-effect -- see above
    setIsDefault(address?.is_default === "1");
    // eslint-disable-next-line react-hooks/set-state-in-effect -- see above
    setCountryId(address?.country_id ? String(address.country_id) : "");
    // eslint-disable-next-line react-hooks/set-state-in-effect -- see above
    setRegionId(address?.region_id ? String(address.region_id) : "");
    // eslint-disable-next-line react-hooks/set-state-in-effect -- see above
    setAutoResolvedCountryId(null);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- see above
    setAutoResolvedRegionId(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, address?.id]);

  // The field list is the picked country's — get_address_custom_fields only
  // honours `country_id` when it's sent, and resolves the coords otherwise.
  // Keyed on countryId so overriding the auto-resolved country swaps the
  // form's fields (add_address only accepts fields of the submitted country).
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoadingFields(true);
    getAddressCustomFieldsApi({
      address_id: address?.id || undefined,
      ...(countryId
        ? { country_id: countryId }
        : mapCenter
          ? { latitude: mapCenter.lat, longitude: mapCenter.lng }
          : {}),
    }).then((response: AddressCustomFieldsResponse | null) => {
      if (cancelled) return;
      const fields = response?.data?.custom_fields ?? [];
      const existingValues = response?.data?.customer_address_custom_fields ?? [];
      setCustomFields(fields);
      setCustomFieldValues(
        Object.fromEntries(existingValues.map((item) => [item.custom_field_id, item.value]))
      );
      setLoadingFields(false);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refetch on country change only; the pin is the fallback when no country is picked yet
  }, [open, countryId, address?.id]);

  // Best-effort pre-select of the country mapCenter lands in — same
  // "don't fight an explicit pick" guard as the desktop dialog.
  useEffect(() => {
    if (!open || !mapCenter || countries.length === 0) return;
    if (countryId && countryId !== autoResolvedCountryId) return;
    const { countryId: resolvedId } = resolveLocationFromBoundaries(mapCenter.lat, mapCenter.lng, countries, []);
    if (!resolvedId) {
      if (countryId && countryId === autoResolvedCountryId) {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- derived from mapCenter/countries, not available during render
        setAutoResolvedCountryId(null);
        setCountryId("");
        setAutoResolvedRegionId(null);
        setRegionId("");
      }
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- derived from mapCenter/countries, not available during render
    setAutoResolvedCountryId(resolvedId);
    setCountryId(resolvedId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mapCenter?.lat, mapCenter?.lng, countries]);

  useEffect(() => {
    if (!mapCenter) return;
    if (regionId && regionId !== autoResolvedRegionId) return;
    const { regionId: matchedId } = resolveLocationFromBoundaries(mapCenter.lat, mapCenter.lng, [], regions);
    if (!matchedId) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- derived from the regions list once it loads, not available during render
    setAutoResolvedRegionId(matchedId);
    setRegionId(matchedId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [regions, mapCenter?.lat, mapCenter?.lng]);

  const handleSubmit = async () => {
    if (!mapCenter) return;
    if (!phone.trim()) {
      toast.error(t("account.addresses.form.mobileRequired"));
      return;
    }
    const missingField = customFields.find(
      (field) => field.required === 1 && !(customFieldValues[field.id] ?? "").trim()
    );
    if (missingField) {
      toast.error(t("account.addresses.form.fieldRequired"));
      return;
    }

    setSaving(true);
    try {
      const response = await addAddressApi({
        address_id: address?.id || undefined,
        mobile: phone,
        lattitude: mapCenter.lat,
        longitude: mapCenter.lng,
        type,
        is_default: isDefault ? "1" : "0",
        country_id: countryId || undefined,
        region_id: regionId || undefined,
        custom_fields: JSON.stringify(
          customFields.map((field) => ({
            custom_field_id: field.id,
            value: customFieldValues[field.id] ?? "",
          }))
        ),
      });
      if (response?.error) throw new Error(response?.message);
      toast.success(t("account.addresses.form.saveSuccess"));
      onSaved();
    } catch {
      toast.error(t("account.addresses.form.saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh] bg-bg-primary">
        <div className="flex w-full flex-col items-center gap-2 px-4">
          <DrawerTitle className="w-full text-base font-medium text-text-primary">
            {address ? t("account.addresses.form.editTitle") : t("account.addresses.form.addTitle")}
          </DrawerTitle>
          <div className="dashed-divider" />
        </div>

        <div className="flex w-full flex-col items-start gap-4 overflow-y-auto px-4 pb-4">
          <div className="flex w-full items-start gap-2">
            {TYPE_OPTIONS.map((option) => {
              const Icon = option.icon;
              const active = type === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setType(option.value)}
                  className={
                    active
                      ? "flex items-center gap-2 rounded-xl border border-border-brand bg-bg-brand-subtle px-3 py-2 text-sm text-text-brand"
                      : "flex items-center gap-2 rounded-xl bg-bg-secondary px-3 py-2 text-sm text-text-primary"
                  }
                >
                  <Icon className="size-5" />
                  {typeLabel[option.value]}
                </button>
              );
            })}
          </div>

          <div className="flex w-full flex-col items-start gap-2">
            <div className="flex w-full flex-col items-start gap-1">
              <FormFieldLabel label={t("account.addresses.form.country")} />
              <SearchableSelect
                options={countries.map((country) => ({ id: country.id, name: country.name, image: country.flag }))}
                value={countryId}
                onChange={(value) => {
                  setCountryId(value);
                  setRegionId("");
                }}
                placeholder={t("account.addresses.form.countryPlaceholder")}
                searchPlaceholder={t("account.addresses.form.countrySearchPlaceholder")}
                noResultsLabel={t("account.addresses.form.countryNoResults")}
                triggerClassName="flex w-full items-center justify-between gap-2 rounded-lg bg-bg-secondary px-3 py-2 text-sm text-text-primary"
              />
            </div>

            <div className="flex w-full flex-col items-start gap-1">
              <FormFieldLabel label={t("account.addresses.form.region")} />
              <SearchableSelect
                options={regions.map((region) => ({ id: region.id, name: region.name }))}
                value={regionId}
                onChange={setRegionId}
                placeholder={t("account.addresses.form.regionPlaceholder")}
                searchPlaceholder={t("account.addresses.form.regionSearchPlaceholder")}
                noResultsLabel={t("account.addresses.form.regionNoResults")}
                disabled={!countryId || regions.length === 0}
                triggerClassName="flex w-full items-center justify-between gap-2 rounded-lg bg-bg-secondary px-3 py-2 text-sm text-text-primary"
              />
            </div>

            {loadingFields &&
              Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="flex w-full flex-col items-start gap-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-full rounded-lg" />
                </div>
              ))}
            {!loadingFields &&
              customFields.map((field) => (
                <div key={field.id} className="flex w-full flex-col items-start gap-1">
                  <FormFieldLabel label={field.label} required={field.required === 1} />
                  {field.field_type === "textarea" ? (
                    <textarea
                      value={customFieldValues[field.id] ?? ""}
                      onChange={(event) =>
                        setCustomFieldValues((current) => ({ ...current, [field.id]: event.target.value }))
                      }
                      rows={2}
                      className="w-full rounded-lg bg-bg-secondary px-3 py-2 text-sm text-text-primary outline-none placeholder:text-text-tertiary"
                    />
                  ) : (
                    <input
                      type={field.field_type === "number" ? "number" : "text"}
                      value={customFieldValues[field.id] ?? ""}
                      onChange={(event) =>
                        setCustomFieldValues((current) => ({ ...current, [field.id]: event.target.value }))
                      }
                      className="w-full rounded-lg bg-bg-secondary px-3 py-2 text-sm text-text-primary outline-none placeholder:text-text-tertiary"
                    />
                  )}
                </div>
              ))}

            <PhoneNumberField
              value={phone}
              onChange={(value) => setPhone(value)}
              label={t("account.addresses.form.mobileNumber")}
            />
          </div>

          <label className="flex w-full items-center gap-1">
            <input
              type="checkbox"
              checked={isDefault}
              onChange={(event) => setIsDefault(event.target.checked)}
              className="size-5 rounded-sm border border-border-default accent-bg-brand"
            />
            <span className="text-sm text-text-primary">{t("account.addresses.form.setAsDefault")}</span>
          </label>
        </div>

        <div className="flex w-full items-center gap-3 bg-bg-primary p-4 shadow-[0px_2px_16px_0px_rgba(0,0,0,0.08)]">
          <AppButton
            variant="primary-outline"
            size="lg"
            className="flex-1 justify-center"
            disabled={saving}
            onClick={() => onOpenChange(false)}
          >
            {t("common.close")}
          </AppButton>
          <AppButton
            variant="primary"
            size="lg"
            className="flex-1 justify-center"
            disabled={saving}
            onClick={handleSubmit}
          >
            {saving ? t("account.addresses.form.saving") : t("account.addresses.form.saveAddress")}
          </AppButton>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
