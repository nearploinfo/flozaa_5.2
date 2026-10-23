import type { AuthenticationMode } from "@/components/auth/use-customer-auth";

export type SigninIdentity =
  | { type: "phone"; value: string; countryCode: string }
  | { type: "email"; value: string };

export type SigninStep =
  | { name: "entry"; mode: "phone" | "email" }
  | {
      name: "otp";
      identity: SigninIdentity;
      authenticationMode: AuthenticationMode;
      purpose: "login" | "register";
    }
  | { name: "password"; identity: SigninIdentity }
  | { name: "set-password"; identity: SigninIdentity; resetToken?: string }
  | { name: "profile"; identity: SigninIdentity; uid?: string; initialUsername?: string }
  | { name: "forgot-otp"; identity: SigninIdentity; authenticationMode: AuthenticationMode }
  | {
      name: "reset-password";
      identity: SigninIdentity;
      authenticationMode: AuthenticationMode;
      resetToken?: string;
    };
