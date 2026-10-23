"use client";

import { useEffect, useRef, useState } from "react";
import { isAxiosError } from "axios";
import { ArrowLeft, Pencil, Search } from "lucide-react";
import { AppButton } from "@/components/ui/app-button";
import { PredictionSkeleton } from "@/components/common/prediction-skeleton";
import { LocationMap, type LatLng } from "@/components/maps/location-map";
import {
  LocationCrosshairIcon,
  LocationPinIcon,
  ServiceUnavailableIllustration,
} from "@/components/icons/icons";
import {
  getPlacesForWebApi,
  getPlacesDeatilsForWebApi,
  providerCheckAvailabilityApi,
  requestAreaCoverageApi,
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
import { useAppSelector } from "@/store/hooks";
import { useTranslation } from "@/lib/i18n/translation-context";

/** Mobile-only full-screen "pick a spot on the map" step, adapted from
 * location-modal.tsx's mobile map step — search + drag-pin + reverse geocode
 * + confirm — but feeding into address creation (AddressFormSheet) instead
 * of the site-wide location. */
export function MobileAddressLocationSheet({
  open,
  onOpenChange,
  initialCenter,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialCenter?: LatLng | null;
  onConfirm: (result: { lat: number; lng: number; formattedAddress: string }) => void;
}) {
  const { t } = useTranslation();
  const savedLat = useAppSelector((state) => state.location.lat);
  const savedLng = useAppSelector((state) => state.location.lng);

  const [mapCenter, setMapCenter] = useState<LatLng>(() =>
    initialCenter ?? getDefaultLatLng(savedLat, savedLng)
  );
  const [resolvedAddress, setResolvedAddress] = useState<{ line: string; lat: number; lng: number } | null>(
    initialCenter ? { line: "", lat: initialCenter.lat, lng: initialCenter.lng } : null
  );
  const [searchDraft, setSearchDraft] = useState("");
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [showPredictions, setShowPredictions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  // "searching" covers the debounce AND the request, so the dropdown shows a
  // skeleton the whole time instead of a premature "no locations found".
  const [searchStatus, setSearchStatus] = useState<"idle" | "searching" | "loaded">("idle");
  const [geoPermission, setGeoPermission] = useState<PermissionState | "unsupported">("prompt");
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [availabilityStatus, setAvailabilityStatus] = useState<"idle" | "unavailable">("idle");
  const [submittingAreaRequest, setSubmittingAreaRequest] = useState(false);
  const [areaRequestSubmitted, setAreaRequestSubmitted] = useState(false);
  const hasAutoLocatedRef = useRef(false);

  const reverseGeocode = async (center: LatLng) => {
    setMapCenter(center);
    try {
      const response: PlaceDetailsByLatLngResponse = await getPlacesDeatilsForWebApi({
        latitude: center.lat,
        longitude: center.lng,
      });
      const result = extractReverseGeocodeResult(response);
      if (!result) return;
      setResolvedAddress({ line: result.formatted_address, lat: result.lat, lng: result.lng });
    } catch (error) {
      console.warn("Failed to reverse geocode pin position:", error);
    }
  };

  useEffect(() => {
    if (!open) return;
    const center = initialCenter ?? getDefaultLatLng(savedLat, savedLng);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- re-seeding from the initial center each time the sheet opens
    setMapCenter(center);
    // Card shows "Resolving location…" immediately for whatever pin position
    // the map opens on (not just after a drag) — reverseGeocode below fills
    // in the real address text once it resolves.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- see above
    setResolvedAddress({ line: "", lat: center.lat, lng: center.lng });
    // eslint-disable-next-line react-hooks/set-state-in-effect -- see above
    setSearchDraft("");
    // eslint-disable-next-line react-hooks/set-state-in-effect -- see above
    setAvailabilityStatus("idle");
    // eslint-disable-next-line react-hooks/set-state-in-effect -- see above
    setAreaRequestSubmitted(false);
    hasAutoLocatedRef.current = false;
    reverseGeocode(center);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.permissions) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing from browser capability check, not derivable from props/state
      setGeoPermission("unsupported");
      return;
    }
    navigator.permissions
      .query({ name: "geolocation" })
      .then((status) => setGeoPermission(status.state))
      .catch(() => setGeoPermission("unsupported"));
  }, []);

  // Auto-locate once per open when there's no address being edited yet.
  useEffect(() => {
    if (
      !open ||
      initialCenter ||
      hasAutoLocatedRef.current ||
      geoPermission === "denied" ||
      typeof navigator === "undefined" ||
      !navigator.geolocation
    ) {
      return;
    }
    hasAutoLocatedRef.current = true;
    navigator.geolocation.getCurrentPosition(
      (position) => reverseGeocode({ lat: position.coords.latitude, lng: position.coords.longitude }),
      (error) => console.warn("Geolocation failed:", error.code, error.message),
      { timeout: 10000 }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, geoPermission, initialCenter]);

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
      setResolvedAddress({
        line: result.formatted_address,
        lat: result.geometry.location.lat,
        lng: result.geometry.location.lng,
      });
    } catch (error) {
      console.warn("Failed to resolve place details:", error);
    }
  };

  const handleUseCurrentLocation = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation || geoPermission === "denied") return;
    navigator.geolocation.getCurrentPosition(
      (position) => reverseGeocode({ lat: position.coords.latitude, lng: position.coords.longitude }),
      (error) => console.warn("Geolocation failed:", error.code, error.message),
      { timeout: 10000 }
    );
  };

  // Mirrors location-modal.tsx's gate: a pin only advances to the address
  // form once a provider actually covers it.
  const handleConfirm = async () => {
    if (!resolvedAddress) return;
    setCheckingAvailability(true);
    try {
      const response: ProviderAvailabilityResponse = await providerCheckAvailabilityApi({
        latitude: resolvedAddress.lat,
        longitude: resolvedAddress.lng,
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
    onConfirm({ lat: resolvedAddress.lat, lng: resolvedAddress.lng, formattedAddress: resolvedAddress.line });
  };

  const handleRequestAreaCoverage = async () => {
    if (!resolvedAddress) return;
    setSubmittingAreaRequest(true);
    try {
      const response = await requestAreaCoverageApi({
        latitude: resolvedAddress.lat,
        longitude: resolvedAddress.lng,
        address: resolvedAddress.line || undefined,
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

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-bg-primary xl:hidden">
      <div className="flex w-full items-center gap-2 bg-bg-primary p-4 shadow-[0px_8px_16px_0px_rgba(0,0,0,0.04)]">
        <AppButton
          variant="link"
          size="lg"
          iconOnly
          leftIcon={(props) => <ArrowLeft {...props} className="size-6 rtl:rotate-180" />}
          aria-label={t("checkoutPage.back")}
          onClick={() => onOpenChange(false)}
          className="rounded-3xl p-2 text-icon-primary"
        >
          {t("checkoutPage.back")}
        </AppButton>
        <span className="flex-1 text-base font-medium text-text-primary">
          {t("account.addresses.form.selectLocationTitle")}
        </span>
      </div>

      <div className="relative min-h-0 flex-1">
        <LocationMap
          center={mapCenter}
          onCenterChange={availabilityStatus === "unavailable" ? undefined : reverseGeocode}
          className="absolute inset-0 size-full"
        />

        {availabilityStatus !== "unavailable" && (
        <div className="absolute inset-x-4 top-4 z-10 flex items-start gap-2">
          <div className="relative flex-1">
            <div
              className={`flex h-12 items-center gap-2 bg-bg-primary px-4 py-3 shadow-[0px_2px_16px_0px_rgba(0,0,0,0.08)] ${
                showPredictions && (predictions.length > 0 || searchDraft.trim()) ? "rounded-t-xl" : "rounded-xl"
              }`}
            >
              <Search className="size-5 shrink-0 text-icon-secondary" />
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
                  } else if (event.key === "Enter" && highlightedIndex >= 0) {
                    event.preventDefault();
                    handleSelectPrediction(predictions[highlightedIndex]);
                  } else if (event.key === "Escape") {
                    setShowPredictions(false);
                  }
                }}
                placeholder={t("account.addresses.form.searchPlaceholder")}
                className="line-clamp-1 flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-secondary focus:outline-none"
              />
            </div>

            {showPredictions && searchStatus === "searching" && (
              <PredictionSkeleton className="absolute top-full left-0 z-10 flex w-full flex-col gap-1 rounded-b-xl border-x border-b border-border-default bg-bg-primary p-2 shadow-lg" />
            )}
            {showPredictions && searchStatus === "loaded" && predictions.length === 0 && (
              <div className="absolute top-full left-0 z-10 w-full rounded-b-xl border-x border-b border-border-default bg-bg-primary p-4 text-center text-sm text-text-secondary shadow-lg">
                {t("account.addresses.form.locationNoResults")}
              </div>
            )}
            {showPredictions && searchStatus === "loaded" && predictions.length > 0 && (
              <ul className="absolute top-full left-0 z-10 flex max-h-72 w-full flex-col gap-1 overflow-y-auto rounded-b-xl border-x border-b border-border-default bg-bg-primary p-2 shadow-lg">
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
            aria-disabled={geoPermission === "denied"}
            className={`size-12 shrink-0 rounded-2xl bg-bg-primary p-3 text-icon-brand shadow-[0px_2px_16px_0px_rgba(0,0,0,0.08)] ${
              geoPermission === "denied" ? "cursor-not-allowed opacity-50" : ""
            }`}
            onClick={handleUseCurrentLocation}
          >
            {t("account.addresses.form.useCurrentLocation")}
          </AppButton>
        </div>
        )}

        {availabilityStatus === "unavailable" ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-bg-primary px-4 py-8">
            <ServiceUnavailableIllustration className="size-48" />
            <div className="flex flex-col items-center gap-2">
              <p className="text-center text-base font-bold text-text-primary">
                {t("account.addresses.form.unavailableTitle")}
              </p>
              <p className="text-center text-xs text-text-secondary">
                {t("account.addresses.form.unavailableDescription")}
              </p>
            </div>
            <div className="flex w-full items-center gap-3 rounded-xl bg-bg-secondary p-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-bg-secondary">
                <LocationPinIcon className="size-5 text-icon-primary" />
              </span>
              <span className="line-clamp-1 flex-1 text-sm font-semibold text-text-primary">
                {resolvedAddress?.line}
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
              size="lg"
              disabled={submittingAreaRequest || areaRequestSubmitted}
              onClick={handleRequestAreaCoverage}
              className="w-full justify-center"
            >
              {areaRequestSubmitted
                ? t("account.addresses.form.requestServiceSubmitted")
                : submittingAreaRequest
                  ? t("account.addresses.form.requestServiceSubmitting")
                  : t("account.addresses.form.requestService")}
            </AppButton>
          </div>
        ) : (
          resolvedAddress && (
            <div className="absolute inset-x-4 bottom-4 z-10 flex flex-col items-start gap-3 rounded-2xl bg-bg-primary p-3 shadow-[0px_2px_16px_0px_rgba(0,0,0,0.08)]">
              <div className="flex w-full items-start gap-4">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-bg-brand-subtle p-3">
                  <LocationPinIcon className="size-6 text-icon-brand" />
                </span>
                <div className="flex flex-1 flex-col items-start gap-1">
                  <span className="line-clamp-2 text-sm font-semibold text-text-primary">
                    {resolvedAddress.line || t("account.addresses.form.resolvingLocation")}
                  </span>
                </div>
              </div>
              <div className="dashed-divider" />
              <AppButton
                variant="primary"
                size="lg"
                className="w-full justify-center"
                disabled={!resolvedAddress.line || checkingAvailability}
                onClick={handleConfirm}
              >
                {checkingAvailability
                  ? t("account.addresses.form.checkingAvailability")
                  : t("account.addresses.form.confirmAddress")}
              </AppButton>
            </div>
          )
        )}
      </div>
    </div>
  );
}
