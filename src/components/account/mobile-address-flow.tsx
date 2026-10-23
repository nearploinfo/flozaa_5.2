"use client";

import { useEffect, useState } from "react";
import { MobileAddressLocationSheet } from "@/components/account/mobile-address-location-sheet";
import { MobileAddressFormSheet } from "@/components/account/mobile-address-form-sheet";
import type { AddressApi } from "@/api/apiRoutes";
import type { LatLng } from "@/components/maps/location-map";

/** Mobile-only two-step add/edit address flow — drop-in swap for
 * AddressFormDialog (which stays desktop's single Dialog): a full-screen
 * map+search step to pick a spot (skipped when editing, since that address
 * already has a position), then a bottom-sheet form for the rest. */
export function MobileAddressFlow({
  open,
  onOpenChange,
  address,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** undefined/null = add mode (shows the location picker first); a loaded
   * address = edit mode (goes straight to the form sheet). */
  address?: AddressApi | null;
  onSaved: () => void;
}) {
  const [step, setStep] = useState<"location" | "form">(address ? "form" : "location");
  const [mapCenter, setMapCenter] = useState<LatLng | null>(
    address
      ? { lat: Number.parseFloat(address.lattitude), lng: Number.parseFloat(address.longitude) }
      : null
  );

  useEffect(() => {
    if (!open) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- re-seeding the step/center each time the flow opens for a (possibly different) address
    setStep(address ? "form" : "location");
    // eslint-disable-next-line react-hooks/set-state-in-effect -- see above
    setMapCenter(
      address
        ? { lat: Number.parseFloat(address.lattitude), lng: Number.parseFloat(address.longitude) }
        : null
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, address?.id]);

  return (
    <>
      <MobileAddressLocationSheet
        open={open && step === "location"}
        onOpenChange={(next) => {
          if (!next) onOpenChange(false);
        }}
        initialCenter={mapCenter}
        onConfirm={({ lat, lng }) => {
          setMapCenter({ lat, lng });
          setStep("form");
        }}
      />
      <MobileAddressFormSheet
        open={open && step === "form"}
        onOpenChange={(next) => {
          if (!next && !address) {
            // Add-mode "Close" backs up to the map step instead of exiting
            // the whole flow — the picked location is still worth keeping.
            setStep("location");
            return;
          }
          onOpenChange(next);
        }}
        address={address}
        mapCenter={mapCenter}
        onSaved={() => {
          // A successful save must fully exit the flow, not fall into the
          // onOpenChange(false) handler above — that one's dedicated to the
          // "Close" button rerouting add-mode back to the map step.
          onSaved();
          onOpenChange(false);
        }}
      />
    </>
  );
}
