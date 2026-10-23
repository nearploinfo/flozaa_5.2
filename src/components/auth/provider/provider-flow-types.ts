import type { AuthenticationMode } from "@/components/auth/use-customer-auth";

export type ProviderIdentity =
  | { type: "phone"; value: string; countryCode: string }
  | { type: "email"; value: string };

export type ProviderRegisterStep =
  | { name: "phone" }
  | { name: "phone-otp"; phone: string; countryCode: string; authenticationMode: AuthenticationMode }
  | { name: "email" }
  | { name: "email-otp"; email: string; authenticationMode: AuthenticationMode }
  | { name: "details"; identity: ProviderIdentity }
  | { name: "success" };
