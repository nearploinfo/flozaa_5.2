import type { AuthenticationMode } from "@/components/auth/use-customer-auth";

export type SignupIdentity =
  | { type: "phone"; value: string; countryCode: string }
  | { type: "email"; value: string };

export type SignupStep =
  | { name: "options" }
  | { name: "phone" }
  | { name: "phone-otp"; phone: string; countryCode: string; authenticationMode: AuthenticationMode }
  | { name: "email" }
  | { name: "email-otp"; email: string; authenticationMode: AuthenticationMode }
  | { name: "profile"; identity: SignupIdentity; uid?: string; initialUsername?: string };
