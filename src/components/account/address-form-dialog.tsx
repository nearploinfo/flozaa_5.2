"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { isAxiosError } from "axios";
import { ArrowLeft, Pencil, Search, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AppButton } from "@/components/ui/app-button";
import { Skeleton } from "@/components/ui/skeleton";
import { PredictionSkeleton } from "@/components/common/prediction-skeleton";
import { FormFieldLabel } from "@/components/auth/shared/form-field-label";
import { LocationMap, type LatLng } from "@/components/maps/location-map";
import { SearchableSelect } from "@/components/account/searchable-select";
import { useCountries } from "@/lib/use-countries";
import { useRegions } from "@/lib/use-regions";
import { resolveLocationFromBoundaries } from "@/lib/resolve-country";
import {
  addAddressApi,
  getAddressCustomFieldsApi,
  getPlacesForWebApi,
  getPlacesDeatilsForWebApi,
  normalizeAddressType,
  providerCheckAvailabilityApi,
  requestAreaCoverageApi,
  type AddressApi,
  type AddressCustomFieldApi,
  type AddressCustomFieldsResponse,
  type AddressType,
} from "@/api/apiRoutes";
import {
  extractReverseGeocodeResult,
  type PlaceDetailsByIdResponse,
  type PlaceDetailsByLatLngResponse,
  type PlacePrediction,
  type PlacesForWebResponse,
} from "@/lib/places-catalog";
import type { ProviderAvailabilityResponse } from "@/lib/providers-catalog";
import { getDefaultLatLng } from "@/lib/helpers";
import {
  AddressHomeIcon,
  AddressOfficeIcon,
  AddressOtherIcon,
  LocationCrosshairIcon,
  LocationPinIcon,
  ServiceUnavailableIllustration,
} from "@/components/icons/icons";
import { useAppSelector } from "@/store/hooks";
import { useTranslation } from "@/lib/i18n/translation-context";

type Step = "location" | "form";

const TYPE_OPTIONS: { value: AddressType; icon: typeof AddressHomeIcon }[] = [
  { value: "home", icon: AddressHomeIcon },
  { value: "office", icon: AddressOfficeIcon },
  { value: "other", icon: AddressOtherIcon },
];

export function AddressFormDialog({
  open,
  onOpenChange,
  address,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** undefined/null = add mode; a loaded address = edit mode. */
  address?: AddressApi | null;
  onSaved: () => void;
}) {
  const { t } = useTranslation();
  const savedLat = useAppSelector((state) => state.location.lat);
  const savedLng = useAppSelector((state) => state.location.lng);

  const typeLabel: Record<AddressType, string> = {
    home: t("account.addresses.typeHome"),
    office: t("account.addresses.typeOffice"),
    other: t("account.addresses.typeOther"),
  };

  // Two-step flow, same shape as the mobile add/edit flow: pick/confirm a
  // map location first, then the rest of the form — for both add and edit,
  // so editing an address still lets you re-pick its pin before the fields.
  const [step, setStep] = useState<Step>("location");
  const [locating, setLocating] = useState(false);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [availabilityStatus, setAvailabilityStatus] = useState<"idle" | "unavailable">("idle");
  const [submittingAreaRequest, setSubmittingAreaRequest] = useState(false);
  const [areaRequestSubmitted, setAreaRequestSubmitted] = useState(false);

  const [type, setType] = useState<AddressType>("home");
  const [mobile, setMobile] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [mapCenter, setMapCenter] = useState<LatLng>(() => getDefaultLatLng(savedLat, savedLng));
  // What the unavailable-location panel shows for the picked pin — reverse
  // geocoded, so it's never blank the way showing `searchDraft` alone would
  // be (that's only ever set by typing a search query or picking a
  // prediction; editing an address, or just dragging the pin, never touches
  // it, which is what left this panel showing an empty line).
  const [resolvedAddressLine, setResolvedAddressLine] = useState("");

  const [customFields, setCustomFields] = useState<AddressCustomFieldApi[]>([]);
  const [customFieldValues, setCustomFieldValues] = useState<Record<number, string>>({});
  const [loadingFields, setLoadingFields] = useState(false);
  const [saving, setSaving] = useState(false);

  // Optional — left unset lets the backend infer both from the map coords
  // sent with the address; picking a country here only matters when the
  // user wants to override that inference.
  const [countryId, setCountryId] = useState<string>("");
  const [regionId, setRegionId] = useState<string>("");
  const [autoResolvedCountryId, setAutoResolvedCountryId] = useState<string | null>(null);
  const [autoResolvedRegionId, setAutoResolvedRegionId] = useState<string | null>(null);
  const { countries } = useCountries();
  const { regions } = useRegions(countryId || null);

  const [searchDraft, setSearchDraft] = useState("");
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [showPredictions, setShowPredictions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  // "searching" covers the debounce AND the request, so the dropdown shows a
  // skeleton the whole time instead of a premature "no locations found".
  const [searchStatus, setSearchStatus] = useState<"idle" | "searching" | "loaded">("idle");

  const reverseGeocode = async (center: LatLng) => {
    try {
      const response: PlaceDetailsByLatLngResponse = await getPlacesDeatilsForWebApi({
        latitude: center.lat,
        longitude: center.lng,
      });
      const result = extractReverseGeocodeResult(response);
      if (result) setResolvedAddressLine(result.formatted_address);
    } catch (error) {
      console.warn("Failed to reverse geocode pin position:", error);
    }
  };

  // Re-seed every time the dialog opens (or the target address changes) —
  // this dialog instance is shared between add and edit, so state from a
  // previous open must not leak into the next one.
  useEffect(() => {
    if (!open) return;

    // eslint-disable-next-line react-hooks/set-state-in-effect -- re-seeding form state from the `address` prop each time the dialog opens, not derivable from render
    setStep("location");
    setAvailabilityStatus("idle");
    setAreaRequestSubmitted(false);
    setType(address ? normalizeAddressType(address.type) : "home");
    setMobile(address?.mobile ?? "");
    setIsDefault(address?.is_default === "1");
    setSearchDraft("");
    setPredictions([]);
    setCountryId(address?.country_id ? String(address.country_id) : "");
    setRegionId(address?.region_id ? String(address.region_id) : "");
    setAutoResolvedCountryId(null);
    setAutoResolvedRegionId(null);

    const lat = address ? Number.parseFloat(address.lattitude) : null;
    const lng = address ? Number.parseFloat(address.longitude) : null;
    const initialCenter =
      Number.isFinite(lat) && Number.isFinite(lng)
        ? { lat: lat as number, lng: lng as number }
        : getDefaultLatLng(savedLat, savedLng);
    setMapCenter(initialCenter);
    setResolvedAddressLine("");
    reverseGeocode(initialCenter);

    // Custom fields aren't fetched here — they're country-specific (per the
    // v5.2.0 API), and at this point the user hasn't picked/confirmed a
    // location yet (that's step 1). Fetched instead in handleConfirmLocation,
    // using whatever coords they actually land on. Just reset to a clean
    // slate so step 2 doesn't flash the previous address's fields.
    setCustomFields([]);
    setCustomFieldValues({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, address?.id]);

  // Best-effort pre-select of the country a pin lands in (pure bounding-box
  // containment, synchronous — see resolve-country.ts), so the select
  // doesn't sit on an empty placeholder when we can already tell what that
  // resolves to. Only runs while the user hasn't picked one explicitly —
  // moving the pin after a manual pick doesn't fight their choice.
  useEffect(() => {
    if (!open || countries.length === 0) return;
    if (countryId && countryId !== autoResolvedCountryId) return;
    const { countryId: resolvedId } = resolveLocationFromBoundaries(mapCenter.lat, mapCenter.lng, countries, []);
    if (!resolvedId) {
      // Pin moved somewhere no country's boundary covers — clear a
      // previously auto-filled value instead of leaving it showing the OLD
      // location's country for the new pin.
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
  }, [open, mapCenter.lat, mapCenter.lng, countries]);

  // Once the resolved country's region list has loaded, match the pin
  // against those regions' boundaries — same "don't fight an explicit pick"
  // guard.
  useEffect(() => {
    if (regionId && regionId !== autoResolvedRegionId) return;
    const { regionId: matchedId } = resolveLocationFromBoundaries(mapCenter.lat, mapCenter.lng, [], regions);
    if (!matchedId) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- derived from the regions list once it loads, not available during render
    setAutoResolvedRegionId(matchedId);
    setRegionId(matchedId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [regions, mapCenter.lat, mapCenter.lng]);

  useEffect(() => {
    let cancelled = false;
    const query = searchDraft.trim();
    if (!query) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- clearing the results this effect owns when the query empties
      setPredictions([]);
      setHighlightedIndex(-1);
      setSearchStatus("idle");
      return;
    }
    // Flipped on the first keystroke, not when the request fires — otherwise
    // the 300ms debounce window shows the empty state.
    setSearchStatus("searching");
    const timer = setTimeout(() => {
      getPlacesForWebApi({ input: query })
        .then((response: PlacesForWebResponse | null) => {
          if (cancelled) return;
          setPredictions(response?.data?.predictions ?? []);
          setHighlightedIndex(-1);
          setSearchStatus("loaded");
        })
        .catch(() => {
          if (cancelled) return;
          setPredictions([]);
          setHighlightedIndex(-1);
          setSearchStatus("loaded");
        });
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [searchDraft]);

  const handleSelectPrediction = async (prediction: PlacePrediction) => {
    setShowPredictions(false);
    setSearchDraft(prediction.description);
    try {
      const response: PlaceDetailsByIdResponse = await getPlacesDeatilsForWebApi({
        place_id: prediction.place_id,
      });
      const result = response?.data?.result;
      if (!result) return;
      setMapCenter(result.geometry.location);
      setResolvedAddressLine(result.formatted_address);
    } catch (error) {
      console.warn("Failed to resolve place details:", error);
    }
  };

  const handlePinMove = (center: LatLng) => {
    setMapCenter(center);
    reverseGeocode(center);
  };

  // Mirrors location-modal.tsx's gate: a pin only advances to the form once
  // a provider actually covers it, so an address never gets saved into a
  // dead zone.
  const handleConfirmLocation = async () => {
    setCheckingAvailability(true);
    try {
      const response: ProviderAvailabilityResponse = await providerCheckAvailabilityApi({
        latitude: mapCenter.lat,
        longitude: mapCenter.lng,
        is_checkout_process: 0,
      });
      if ((response?.data?.length ?? 0) === 0) {
        setAvailabilityStatus("unavailable");
        return;
      }
    } catch (error) {
      // Backend responds with an HTTP 404 (not a 200 + empty array) when no
      // providers cover this location — same "unavailable" outcome as an
      // empty data[], not a real failure.
      if (isAxiosError(error) && error.response?.status === 404) {
        setAvailabilityStatus("unavailable");
        return;
      }
      // Fail open for genuine errors (network hiccup, 5xx, etc.) — don't
      // block the form just because the availability check itself broke.
      console.warn("Failed to check provider availability:", error);
    } finally {
      setCheckingAvailability(false);
    }
    setStep("form");
  };

  const handleRequestAreaCoverage = async () => {
    setSubmittingAreaRequest(true);
    try {
      const response = await requestAreaCoverageApi({
        latitude: mapCenter.lat,
        longitude: mapCenter.lng,
        address: resolvedAddressLine || undefined,
      });
      if (response && !response.error) {
        setAreaRequestSubmitted(true);
      }
    } catch (error) {
      console.warn("Failed to submit area coverage request:", error);
    } finally {
      setSubmittingAreaRequest(false);
    }
  };

  // The field list is the picked country's, not the pin's — get_address_custom_fields
  // only honours `country_id` when it's sent, and falls back to resolving the
  // coords otherwise. Keyed on countryId so overriding the auto-resolved
  // country swaps the form's fields instead of leaving the previous country's
  // on screen (and then failing add_address, which only accepts fields
  // belonging to the submitted country).
  useEffect(() => {
    if (!open || step !== "form") return;
    let cancelled = false;
    setLoadingFields(true);
    getAddressCustomFieldsApi({
      address_id: address?.id || undefined,
      ...(countryId
        ? { country_id: countryId }
        : { latitude: mapCenter.lat, longitude: mapCenter.lng }),
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
  }, [open, step, countryId, address?.id]);

  const handleUseCurrentLocation = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const center = { lat: position.coords.latitude, lng: position.coords.longitude };
        setMapCenter(center);
        reverseGeocode(center);
        setLocating(false);
      },
      (error) => {
        console.warn("Geolocation failed:", error.code, error.message);
        setLocating(false);
      },
      { timeout: 10000 }
    );
  };

  const handleClose = (next: boolean) => onOpenChange(next);

  const handleSubmit = async () => {
    if (!mobile.trim()) {
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
        mobile,
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
      handleClose(false);
    } catch {
      toast.error(t("account.addresses.form.saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        showCloseButton={false}
        className="flex max-h-[90vh] w-[calc(100%-2rem)] max-w-[calc(100%-2rem)] flex-col gap-0 overflow-hidden rounded-2xl border border-border-default bg-bg-primary p-0 lg:max-w-[640px]"
      >
        <DialogHeader className="flex-row shrink-0 items-center gap-3 border-b border-border-default px-4 py-4 lg:px-6">
          {step === "form" && (
            <AppButton
              variant="secondary-outline"
              size="md"
              iconOnly
              leftIcon={ArrowLeft}
              aria-label={t("checkoutPage.back")}
              onClick={() => setStep("location")}
              className="shrink-0 rounded-lg border-border-default bg-bg-secondary p-2"
            >
              {t("checkoutPage.back")}
            </AppButton>
          )}
          <DialogTitle className="flex-1 text-start text-lg font-medium text-text-primary">
            {address ? t("account.addresses.form.editTitle") : t("account.addresses.form.addTitle")}
          </DialogTitle>
          <AppButton
            variant="secondary-outline"
            size="md"
            iconOnly
            leftIcon={X}
            aria-label="Close"
            onClick={() => handleClose(false)}
            className="rounded-lg border-border-default bg-bg-secondary p-2"
          >
            Close
          </AppButton>
        </DialogHeader>

        {step === "location" && availabilityStatus === "unavailable" ? (
          <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4 overflow-y-auto p-6">
            <ServiceUnavailableIllustration className="size-48" />
            <div className="flex flex-col items-center gap-2">
              <p className="text-center text-base font-bold text-text-primary">
                {t("account.addresses.form.unavailableTitle")}
              </p>
              <p className="text-center text-sm text-text-secondary">
                {t("account.addresses.form.unavailableDescription")}
              </p>
            </div>
            <div className="flex w-full items-center gap-3 rounded-xl bg-bg-secondary p-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-bg-secondary">
                <LocationPinIcon className="size-5 text-icon-primary" />
              </span>
              <span className="line-clamp-1 flex-1 text-sm font-semibold text-text-primary">
                {resolvedAddressLine || t("account.addresses.form.resolvingLocation")}
              </span>
              <AppButton
                variant="link"
                size="sm"
                iconOnly
                leftIcon={Pencil}
                aria-label={t("account.addresses.form.editLocation")}
                onClick={() => setAvailabilityStatus("idle")}
              >
                {t("account.addresses.form.editLocation")}
              </AppButton>
            </div>
            <AppButton
              variant="primary"
              size="md"
              className="w-full"
              disabled={submittingAreaRequest || areaRequestSubmitted}
              onClick={handleRequestAreaCoverage}
            >
              {areaRequestSubmitted
                ? t("account.addresses.form.requestServiceSubmitted")
                : submittingAreaRequest
                  ? t("account.addresses.form.requestServiceSubmitting")
                  : t("account.addresses.form.requestService")}
            </AppButton>
          </div>
        ) : step === "location" ? (
          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-6 lg:overflow-hidden">
            {/* Fixed height, not flex-1/min-h — Leaflet reads the container's
                size at mount to lay out tiles, and a flex-grow-sized box
                hasn't settled to its final height yet at that point, so the
                map renders blank until something calls invalidateSize(). */}
            <div className="relative h-72 shrink-0 overflow-hidden rounded-xl lg:h-[420px]">
              <LocationMap center={mapCenter} onCenterChange={handlePinMove} className="size-full" />
              {/* Leaflet's own control panes (.leaflet-top etc) use z-index up to 1000,
                  which otherwise paints over any sibling overlay at a "normal" z-index
                  despite hit-testing still favoring the overlay — must clear that. */}
              <div className="absolute left-6 right-6 top-6 z-[1001] flex items-start gap-3">
                <div className="relative flex-1">
                  <div className="flex items-center gap-4 rounded-lg border border-border-default bg-bg-primary px-4 py-3 shadow-[0px_6px_12px_0px_rgba(0,0,0,0.07)]">
                    <Search className="size-6 shrink-0 text-icon-secondary" />
                    <input
                      type="text"
                      value={searchDraft}
                      onChange={(event) => setSearchDraft(event.target.value)}
                      onFocus={() => setShowPredictions(true)}
                      onBlur={() => setTimeout(() => setShowPredictions(false), 150)}
                      onKeyDown={(event) => {
                        if (!showPredictions || predictions.length === 0) return;
                        if (event.key === "ArrowDown") {
                          event.preventDefault();
                          setHighlightedIndex((index) => (index + 1) % predictions.length);
                        } else if (event.key === "ArrowUp") {
                          event.preventDefault();
                          setHighlightedIndex((index) => (index - 1 + predictions.length) % predictions.length);
                        } else if (event.key === "Enter") {
                          if (highlightedIndex >= 0) {
                            event.preventDefault();
                            handleSelectPrediction(predictions[highlightedIndex]);
                          }
                        } else if (event.key === "Escape") {
                          setShowPredictions(false);
                        }
                      }}
                      placeholder={t("account.addresses.form.searchPlaceholder")}
                      className="line-clamp-1 flex-1 bg-transparent text-base text-text-primary placeholder:text-text-secondary focus:outline-none"
                    />
                  </div>
                  {showPredictions && searchStatus === "searching" && (
                    <PredictionSkeleton className="absolute left-0 top-[calc(100%+0.5rem)] z-[1001] flex w-full flex-col gap-1 rounded-lg border border-border-default bg-bg-primary p-2 shadow-lg" />
                  )}
                  {showPredictions && searchStatus === "loaded" && predictions.length === 0 && (
                    <div className="absolute left-0 top-[calc(100%+0.5rem)] z-[1001] w-full rounded-lg border border-border-default bg-bg-primary p-4 text-center text-sm text-text-secondary shadow-lg">
                      {t("account.addresses.form.locationNoResults")}
                    </div>
                  )}
                  {showPredictions && searchStatus === "loaded" && predictions.length > 0 && (
                    <ul className="absolute left-0 top-[calc(100%+0.5rem)] z-[1001] flex max-h-72 w-full flex-col gap-1 overflow-y-auto rounded-lg border border-border-default bg-bg-primary p-2 shadow-lg">
                      {predictions.map((prediction, index) => (
                        <li key={prediction.place_id}>
                          <AppButton
                            variant="link"
                            onPointerDown={(event) => event.preventDefault()}
                            onClick={() => handleSelectPrediction(prediction)}
                            onMouseEnter={() => setHighlightedIndex(index)}
                            className={
                              index === highlightedIndex
                                ? "flex w-full flex-col items-start gap-0.5 rounded-md bg-bg-secondary px-3 py-2 text-start"
                                : "flex w-full flex-col items-start gap-0.5 rounded-md px-3 py-2 text-start hover:bg-bg-secondary"
                            }
                          >
                            <span className="text-sm font-medium text-text-primary">
                              {prediction.structured_formatting.main_text}
                            </span>
                            {prediction.structured_formatting.secondary_text && (
                              <span className="text-sm text-text-secondary">
                                {prediction.structured_formatting.secondary_text}
                              </span>
                            )}
                          </AppButton>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <AppButton
                  type="button"
                  variant="secondary"
                  iconOnly
                  leftIcon={LocationCrosshairIcon}
                  aria-label={t("account.addresses.form.useCurrentLocation")}
                  disabled={locating}
                  className="shrink-0 rounded-lg border border-border-default bg-bg-primary p-3 text-icon-brand shadow-[0px_6px_12px_0px_rgba(0,0,0,0.07)]"
                  onClick={handleUseCurrentLocation}
                >
                  {t("account.addresses.form.useCurrentLocation")}
                </AppButton>
              </div>
            </div>

            <AppButton
              variant="primary"
              size="md"
              className="w-full shrink-0"
              disabled={checkingAvailability}
              onClick={handleConfirmLocation}
            >
              {checkingAvailability
                ? t("account.addresses.form.checkingAvailability")
                : t("account.addresses.form.confirmAddress")}
            </AppButton>
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col items-start gap-6 overflow-y-auto p-6">
            <div className="flex w-full shrink-0 items-start gap-3">
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
                        ? "flex items-center gap-2 rounded-3xl border border-border-brand bg-bg-brand-subtle px-3 py-2 text-sm text-text-brand"
                        : "flex items-center gap-2 rounded-3xl border border-border-default bg-bg-primary px-3 py-2 text-sm text-text-primary"
                    }
                  >
                    <Icon className="size-4" />
                    {typeLabel[option.value]}
                  </button>
                );
              })}
            </div>

            <div className="flex w-full shrink-0 flex-col items-start gap-2">
              <FormFieldLabel label={t("account.addresses.form.mobileNumber")} required />
              <input
                type="tel"
                value={mobile}
                onChange={(event) => setMobile(event.target.value)}
                placeholder={t("account.addresses.form.mobilePlaceholder")}
                className="w-full rounded-sm border border-form-field-border bg-bg-secondary px-4 py-2 text-base text-form-field-text placeholder:text-form-field-placeholder focus:border-form-field-focus focus:outline-none"
              />
            </div>

            <div className="flex w-full shrink-0 flex-col items-start gap-4">
              <div className="flex w-full flex-col items-start gap-2">
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
                  triggerClassName="flex w-full items-center justify-between gap-2 rounded-sm border border-form-field-border bg-bg-secondary px-4 py-2 text-base text-form-field-text"
                />
              </div>
              <div className="flex w-full flex-col items-start gap-2">
                <FormFieldLabel label={t("account.addresses.form.region")} />
                <SearchableSelect
                  options={regions.map((region) => ({ id: region.id, name: region.name }))}
                  value={regionId}
                  onChange={setRegionId}
                  placeholder={t("account.addresses.form.regionPlaceholder")}
                  searchPlaceholder={t("account.addresses.form.regionSearchPlaceholder")}
                  noResultsLabel={t("account.addresses.form.regionNoResults")}
                  disabled={!countryId || regions.length === 0}
                  triggerClassName="flex w-full items-center justify-between gap-2 rounded-sm border border-form-field-border bg-bg-secondary px-4 py-2 text-base text-form-field-text"
                />
              </div>
            </div>

            {/* Custom field count varies per admin config — this section scrolls on
                its own so the type/mobile header and the checkbox/submit footer stay
                pinned regardless of how many fields come back. */}
            <div className="flex min-h-0 w-full flex-1 flex-col items-start gap-4 overflow-y-auto pe-1">
              {loadingFields &&
                Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="flex w-full shrink-0 flex-col items-start gap-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-10 w-full rounded-sm" />
                  </div>
                ))}
              {!loadingFields &&
                customFields.map((field) => (
                  <div key={field.id} className="flex w-full shrink-0 flex-col items-start gap-2">
                    <FormFieldLabel label={field.label} required={field.required === 1} />
                    {field.field_type === "textarea" ? (
                      <textarea
                        value={customFieldValues[field.id] ?? ""}
                        onChange={(event) =>
                          setCustomFieldValues((current) => ({
                            ...current,
                            [field.id]: event.target.value,
                          }))
                        }
                        rows={3}
                        className="w-full rounded-sm border border-form-field-border bg-bg-secondary px-4 py-2 text-base text-form-field-text placeholder:text-form-field-placeholder focus:border-form-field-focus focus:outline-none"
                      />
                    ) : (
                      <input
                        type={field.field_type === "number" ? "number" : "text"}
                        value={customFieldValues[field.id] ?? ""}
                        onChange={(event) =>
                          setCustomFieldValues((current) => ({
                            ...current,
                            [field.id]: event.target.value,
                          }))
                        }
                        className="w-full rounded-sm border border-form-field-border bg-bg-secondary px-4 py-2 text-base text-form-field-text placeholder:text-form-field-placeholder focus:border-form-field-focus focus:outline-none"
                      />
                    )}
                  </div>
                ))}
            </div>

            <label className="flex shrink-0 items-center gap-2">
              <input
                type="checkbox"
                checked={isDefault}
                onChange={(event) => setIsDefault(event.target.checked)}
                className="size-4 rounded-sm border border-border-black accent-bg-brand"
              />
              <span className="text-sm text-text-secondary">
                {t("account.addresses.form.setAsDefault")}
              </span>
            </label>

            <AppButton
              variant="primary"
              size="md"
              disabled={saving}
              onClick={handleSubmit}
              className="w-full shrink-0"
            >
              {saving ? t("account.addresses.form.saving") : t("account.addresses.form.continue")}
            </AppButton>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
