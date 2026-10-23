"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getAddressCustomFieldsApi,
  type AddressApi,
  type AddressCustomFieldApi,
  type AddressCustomFieldsResponse,
} from "@/api/apiRoutes";
import { useCountries } from "@/lib/use-countries";
import { useRegions } from "@/lib/use-regions";
import type { DeliveryAddressType } from "@/lib/checkout/checkout-types";

/**
 * Billing address for place_order (2.16).
 *
 * `billing_same_as_shipping` is required on EVERY booking — cart, rebooking
 * and custom job alike — so this is not an optional extra: without it the
 * order is rejected outright. The billing address is stored with the booking
 * and nothing else; tax and fees still come from the SERVICE address (or the
 * provider's own country/region for an at-store booking), so changing it here
 * never moves the total.
 *
 * At-store bookings have no service address, which is exactly why they always
 * need a separate billing one — `billing_same_as_shipping=1` is rejected for
 * them.
 */
export interface BillingValidationError {
  /** Which part the customer still has to fill in. */
  field: "country" | "region" | "customField";
  /** The offending custom field, when `field` is "customField". */
  label?: string;
}

export function useBillingAddress({
  deliveryAddressType,
  serviceAddress,
}: {
  deliveryAddressType: DeliveryAddressType;
  /** The chosen service address — the source for the "same as service address" path. */
  serviceAddress: AddressApi | null;
}) {
  // An at-store booking has no service address to copy, so "same as" isn't
  // even an option there — the API rejects it.
  const canUseServiceAddress = deliveryAddressType === "doorstep";
  const [sameAsServiceRequested, setSameAsServiceRequested] = useState(true);
  const sameAsService = canUseServiceAddress && sameAsServiceRequested;

  const [countryId, setCountryId] = useState("");
  const [regionId, setRegionId] = useState("");
  const [mobile, setMobile] = useState("");
  const [type, setType] = useState("");
  const [fields, setFields] = useState<AddressCustomFieldApi[]>([]);
  const [fieldValues, setFieldValues] = useState<Record<number, string>>({});
  const [fieldsStatus, setFieldsStatus] = useState<"idle" | "loading" | "loaded">("idle");

  const { countries } = useCountries();
  const { regions } = useRegions(countryId || null);

  // Seed from the service address the first time a separate billing address is
  // opened — most people bill to roughly where they're served, so starting
  // from its country/region/mobile saves re-picking all of it.
  useEffect(() => {
    if (sameAsService || countryId || !serviceAddress) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot seed from the selected service address, not derivable during render
    setCountryId(serviceAddress.country_id ? String(serviceAddress.country_id) : "");
    setRegionId(serviceAddress.region_id ? String(serviceAddress.region_id) : "");
    setMobile((current) => current || serviceAddress.mobile || "");
    // eslint-disable-next-line react-hooks/exhaustive-deps -- seeds once per open, deliberately not re-running as the user edits
  }, [sameAsService, serviceAddress?.id]);

  // The billing form's fields are the BILLING country's address fields, which
  // is why country_id is sent rather than coordinates (billing has no map
  // location at all — no latitude/longitude is stored for it).
  useEffect(() => {
    if (sameAsService || !countryId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- clearing the fields this effect fetched, not deriving state from props
      setFields([]);
      setFieldValues({});
      setFieldsStatus("idle");
      return;
    }
    let cancelled = false;
    setFieldsStatus("loading");
    getAddressCustomFieldsApi({ country_id: countryId }).then(
      (response: AddressCustomFieldsResponse | null) => {
        if (cancelled) return;
        setFields(response?.data?.custom_fields ?? []);
        setFieldValues({});
        setFieldsStatus("loaded");
      }
    );
    return () => {
      cancelled = true;
    };
  }, [sameAsService, countryId]);

  const setFieldValue = (fieldId: number, value: string) =>
    setFieldValues((current) => ({ ...current, [fieldId]: value }));

  const selectCountry = (next: string) => {
    setCountryId(next);
    // Regions belong to a country — a stale one from the previous country is
    // rejected by place_order ("region_id that does not belong to country_id").
    setRegionId("");
  };

  /** Blocks checkout with the first thing still missing, mirroring the
   * server's own checks so the customer sees it on the form instead of as a
   * failed order. */
  const validationError = useMemo<BillingValidationError | null>(() => {
    if (sameAsService) return null;
    if (!countryId) return { field: "country" };
    // A region is required only when the chosen country actually has them.
    if (regions.length > 0 && !regionId) return { field: "region" };
    if (fieldsStatus !== "loaded") return { field: "customField" };
    const missing = fields.find(
      (field) => field.required === 1 && !(fieldValues[field.id] ?? "").trim()
    );
    return missing ? { field: "customField", label: missing.label } : null;
  }, [sameAsService, countryId, regionId, regions.length, fields, fieldValues, fieldsStatus]);

  const isValid = validationError === null;

  /** The place_order params for the billing address. */
  const orderParams = (): Record<string, string | number> => {
    if (sameAsService) return { billing_same_as_shipping: 1 };
    return {
      billing_same_as_shipping: 0,
      billing_country_id: countryId,
      ...(regionId ? { billing_region_id: regionId } : {}),
      ...(mobile.trim() ? { billing_mobile: mobile.trim() } : {}),
      ...(type.trim() ? { billing_type: type.trim().slice(0, 50) } : {}),
      billing_custom_fields: JSON.stringify(
        fields.map((field) => ({
          custom_field_id: field.id,
          value: fieldValues[field.id] ?? "",
        }))
      ),
    };
  };

  return {
    canUseServiceAddress,
    sameAsService,
    setSameAsService: setSameAsServiceRequested,
    countries,
    regions,
    countryId,
    selectCountry,
    regionId,
    setRegionId,
    mobile,
    setMobile,
    type,
    setType,
    fields,
    fieldValues,
    setFieldValue,
    fieldsStatus,
    validationError,
    isValid,
    orderParams,
  };
}

export type BillingAddressState = ReturnType<typeof useBillingAddress>;
