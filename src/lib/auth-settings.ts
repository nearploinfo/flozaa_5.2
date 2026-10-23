import { useAppSelector } from "@/store/hooks";

export interface LoginSettings {
  phone_authentication_enabled: boolean;
  email_authentication_enabled: boolean;
  social_authentication_enabled: boolean;
  customer_password_login_enabled: boolean;
  minimum_password_length: number;
  require_at_least_one_uppercase: boolean;
  require_at_least_one_lowercase: boolean;
  require_at_least_one_number: boolean;
  require_at_least_one_special_character: boolean;
}

const DEFAULT_LOGIN_SETTINGS: LoginSettings = {
  phone_authentication_enabled: true,
  email_authentication_enabled: true,
  social_authentication_enabled: true,
  customer_password_login_enabled: true,
  minimum_password_length: 8,
  require_at_least_one_uppercase: true,
  require_at_least_one_lowercase: true,
  require_at_least_one_number: true,
  require_at_least_one_special_character: true,
};

function toBool(value: unknown, fallback: boolean): boolean {
  if (value === undefined || value === null) return fallback;
  return value === 1 || value === "1" || value === true;
}

function toNumber(value: unknown, fallback: number): number {
  const num = Number(value);
  return Number.isFinite(num) && num > 0 ? num : fallback;
}

export function useLoginSettings(): LoginSettings {
  const raw = useAppSelector((state) => state.settings.data) as
    | { login_settings?: Record<string, unknown> }
    | null;
  const source = raw?.login_settings ?? {};
  return {
    phone_authentication_enabled: toBool(
      source.phone_authentication_enabled,
      DEFAULT_LOGIN_SETTINGS.phone_authentication_enabled
    ),
    email_authentication_enabled: toBool(
      source.email_authentication_enabled,
      DEFAULT_LOGIN_SETTINGS.email_authentication_enabled
    ),
    social_authentication_enabled: toBool(
      source.social_authentication_enabled,
      DEFAULT_LOGIN_SETTINGS.social_authentication_enabled
    ),
    customer_password_login_enabled: toBool(
      source.customer_password_login_enabled,
      DEFAULT_LOGIN_SETTINGS.customer_password_login_enabled
    ),
    minimum_password_length: toNumber(
      source.minimum_password_length,
      DEFAULT_LOGIN_SETTINGS.minimum_password_length
    ),
    require_at_least_one_uppercase: toBool(
      source.require_at_least_one_uppercase,
      DEFAULT_LOGIN_SETTINGS.require_at_least_one_uppercase
    ),
    require_at_least_one_lowercase: toBool(
      source.require_at_least_one_lowercase,
      DEFAULT_LOGIN_SETTINGS.require_at_least_one_lowercase
    ),
    require_at_least_one_number: toBool(
      source.require_at_least_one_number,
      DEFAULT_LOGIN_SETTINGS.require_at_least_one_number
    ),
    require_at_least_one_special_character: toBool(
      source.require_at_least_one_special_character,
      DEFAULT_LOGIN_SETTINGS.require_at_least_one_special_character
    ),
  };
}

/** Fallback country codes from env, used when admin hasn't configured
 * available_country_codes (or the API hasn't returned them yet) */
function getFallbackCountryCodes(): string[] {
  const raw = process.env.NEXT_PUBLIC_DEFAULT_COUNTRY_CODES;
  if (!raw) return [];
  return raw
    .split(",")
    .map((code) => code.trim().toLowerCase())
    .filter(Boolean);
}

/** Lowercase ISO country codes (e.g. "in", "us") for react-phone-input-2's
 * `onlyCountries` prop — falls back to env when admin's list is empty. */
export function parseCountryCodes(availableCountryCodes: unknown): string[] {
  let codes: string[] = [];
  if (Array.isArray(availableCountryCodes)) {
    codes = availableCountryCodes.map((code) => String(code).toLowerCase());
  } else if (typeof availableCountryCodes === "string") {
    try {
      const parsed = JSON.parse(availableCountryCodes);
      if (Array.isArray(parsed)) {
        codes = parsed.map((code) => String(code).toLowerCase()).filter(Boolean);
      }
    } catch {
      codes = [];
    }
  }
  return codes.length > 0 ? codes : getFallbackCountryCodes();
}

export function useAvailableCountryCodes(): string[] {
  const raw = useAppSelector((state) => state.settings.data) as
    | { available_country_codes?: unknown }
    | null;
  return parseCountryCodes(raw?.available_country_codes);
}

/** Lowercase ISO country code (e.g. "in") for react-phone-input-2's `country`
 * prop — NOT the dial code. Admin's general_settings.default_country_code is
 * an ISO code (e.g. "IN"), so this only needs lowercasing, not a "+" prefix. */
export function useDefaultCountryCode(): string {
  const raw = useAppSelector((state) => state.settings.data) as
    | { general_settings?: { default_country_code?: string } }
    | null;
  return (
    raw?.general_settings?.default_country_code?.toLowerCase() ||
    process.env.NEXT_PUBLIC_DEFAULT_COUNTRY_CODE?.toLowerCase() ||
    "in"
  );
}
