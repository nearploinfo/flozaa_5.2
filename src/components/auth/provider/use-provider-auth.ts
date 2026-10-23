"use client";

import type { RecaptchaVerifier } from "firebase/auth";
import {
  verifyProviderApi,
  resendProviderOtpApi,
  verifyProviderOtpApi,
  registerProviderApi,
} from "@/api/apiRoutes";
import { getFirebaseAuth } from "@/lib/firebase";
import type {
  IdentifierMode,
  AuthenticationMode,
  VerifyUserResponse,
  VerifyOtpResponse,
} from "@/components/auth/use-customer-auth";

declare global {
  interface Window {
    confirmationResult?: import("firebase/auth").ConfirmationResult;
  }
}

function identityBody(mode: IdentifierMode, value: string, countryCode: string) {
  return mode === "email" ? { email: value } : { mobile: value, country_code: countryCode };
}

export interface RegisterProviderResponse {
  error: boolean;
  message: string;
}

export function useProviderAuth() {
  const verifyIdentity = async (params: {
    mode: IdentifierMode;
    value: string;
    countryCode: string;
  }): Promise<VerifyUserResponse> => {
    return verifyProviderApi({
      ...identityBody(params.mode, params.value, params.countryCode),
      login_type: params.mode,
    });
  };

  const sendOtp = async (params: {
    mode: IdentifierMode;
    value: string;
    countryCode: string;
    authenticationMode: AuthenticationMode;
    recaptchaVerifier?: RecaptchaVerifier;
  }): Promise<void> => {
    if (params.mode === "phone" && params.authenticationMode === "firebase") {
      if (!params.recaptchaVerifier) throw new Error("Verification is not ready yet, please retry.");
      const { signInWithPhoneNumber } = await import("firebase/auth");
      const confirmationResult = await signInWithPhoneNumber(
        getFirebaseAuth(),
        `${params.countryCode}${params.value}`,
        params.recaptchaVerifier
      );
      window.confirmationResult = confirmationResult;
      return;
    }
    const response = await resendProviderOtpApi({
      ...identityBody(params.mode, params.value, params.countryCode),
    });
    if (response?.error) throw new Error(response.message ?? "Failed to send verification code.");
  };

  const verifyOtp = async (params: {
    mode: IdentifierMode;
    value: string;
    countryCode: string;
    otp: string;
    authenticationMode: AuthenticationMode;
  }): Promise<VerifyOtpResponse> => {
    if (params.mode === "phone" && params.authenticationMode === "firebase") {
      if (!window.confirmationResult) {
        throw new Error("Your verification session expired, please request a new code.");
      }
      await window.confirmationResult.confirm(params.otp);
      return { error: false, message: "" };
    }
    return verifyProviderOtpApi({
      ...identityBody(params.mode, params.value, params.countryCode),
      otp: params.otp,
    });
  };

  const register = async (
    params: Record<string, string | undefined>
  ): Promise<RegisterProviderResponse> => {
    return registerProviderApi(params);
  };

  return { verifyIdentity, sendOtp, verifyOtp, register };
}
