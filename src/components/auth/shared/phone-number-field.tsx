"use client";

import { useMemo, useState } from "react";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { FormFieldLabel } from "@/components/auth/shared/form-field-label";
import { useAvailableCountryCodes, useDefaultCountryCode } from "@/lib/auth-settings";
import { useCountryCodes } from "@/lib/use-country-codes";
import { useTranslation } from "@/lib/i18n/translation-context";

/** react-phone-input-2 ships its own flag sprite (`.flag.<iso2>`, e.g.
 * `.flag.in`) — override it per country with the admin-managed real flag
 * image from get_country_codes instead of the package's built-in art. */
function useFlagOverrideStyle(): string {
  const { countryCodes } = useCountryCodes();
  return useMemo(() => {
    return countryCodes
      .filter((entry) => entry.country_code && entry.flag_image)
      .map((entry) => {
        const iso2 = entry.country_code.toLowerCase();
        return `.react-tel-input .flag.${iso2}{background-image:url(${JSON.stringify(entry.flag_image)})!important;background-position:center!important;background-size:cover!important;background-repeat:no-repeat!important;}`;
      })
      .join("\n");
  }, [countryCodes]);
}

export function PhoneNumberField({
  value,
  onChange,
  autoFocus,
  disabled,
  required = true,
  label,
}: {
  value: string;
  /** `nationalNumber` excludes the dial code; `dialCode` has a leading "+" (e.g. "+91"). */
  onChange: (value: string, dialCode: string, nationalNumber: string) => void;
  autoFocus?: boolean;
  disabled?: boolean;
  required?: boolean;
  label?: string;
}) {
  const { t } = useTranslation();
  const [focused, setFocused] = useState(false);
  const defaultCountryCode = useDefaultCountryCode();
  const availableCountryCodes = useAvailableCountryCodes();
  const flagOverrideStyle = useFlagOverrideStyle();
  return (
    <div className={`flex w-full flex-col items-start gap-2 ${disabled ? "opacity-60" : ""}`}>
      {flagOverrideStyle && <style>{flagOverrideStyle}</style>}
      <FormFieldLabel label={label ?? t("auth.phoneField.label")} required={required} />
      <PhoneInput
        country={defaultCountryCode}
        value={value}
        onChange={(fullValue, country) => {
          const dialCode = (country as { dialCode?: string })?.dialCode ?? "";
          onChange(fullValue, `+${dialCode}`, fullValue.slice(dialCode.length));
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        inputProps={{ autoFocus }}
        disabled={disabled}
        enableSearch
        onlyCountries={availableCountryCodes.length > 0 ? availableCountryCodes : undefined}
        disableDropdown={availableCountryCodes.length === 1}
        containerClass="w-full!"
        inputStyle={{
          width: "100%",
          height: "42px",
          fontSize: "1rem",
          fontFamily: "inherit",
          color: "var(--form-field-text)",
          backgroundColor: "var(--form-field-bg)",
          borderColor: focused ? "var(--form-field-focus)" : "var(--form-field-border)",
          borderRadius: "var(--radius-sm)",
          boxShadow: focused ? "0px 0px 0px 3px rgba(0,121,255,0.10)" : "none",
        }}
        buttonStyle={{
          backgroundColor: "var(--form-field-bg)",
          borderColor: focused ? "var(--form-field-focus)" : "var(--form-field-border)",
          borderRadius: "var(--radius-sm) 0 0 var(--radius-sm)",
        }}
      />
    </div>
  );
}
