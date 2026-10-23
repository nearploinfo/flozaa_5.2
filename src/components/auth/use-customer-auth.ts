"use client";

import { isAxiosError } from "axios";
import type { ConfirmationResult, RecaptchaVerifier } from "firebase/auth";
import {
  verifyUserApi,
  manageUserApi,
  verifyOTPApi,
  resendOTPApi,
  changePasswordApi,
  getSettingsApi,
} from "@/api/apiRoutes";
import { getFirebaseAuth, googleProvider, fetchFcmToken } from "@/lib/firebase";
import { useAppDispatch } from "@/store/hooks";
import { setToken, setUserData, type AuthUser } from "@/store/slices/auth-slice";
import { setSettings } from "@/store/slices/settings-slice";

declare global {
  interface Window {
    confirmationResult?: ConfirmationResult;
  }
}

export type IdentifierMode = "phone" | "email";
export type AuthenticationMode = "firebase" | "sms_gateway";

export interface VerifyUserResponse {
  error: boolean;
  message: string;
  message_code: number | string;
  has_password?: boolean;
  authentication_mode?: AuthenticationMode;
}

export interface ManageUserResponse {
  error: boolean;
  message: string;
  data?: AuthUser;
  token?: string;
}

export interface VerifyOtpResponse {
  error: boolean;
  message: string;
  reset_token?: string;
  user?: AuthUser;
}

export interface ChangePasswordResponse {
  error: boolean;
  message: string;
}

/** Backend returns message_code as a string ("102") despite the doc showing it as a number — normalize. */
export function toMessageCode(value: VerifyUserResponse["message_code"]): number {
  return Number(value);
}

function identityBody(mode: IdentifierMode, value: string, countryCode: string) {
  return mode === "email" ? { email: value } : { mobile: value, country_code: countryCode };
}

const FIREBASE_ERROR_KEYS: Record<string, string> = {
  "auth/invalid-verification-code": "auth.errors.firebase.invalidCode",
  "auth/code-expired": "auth.errors.firebase.codeExpired",
  "auth/too-many-requests": "auth.errors.firebase.tooManyRequests",
  "auth/popup-closed-by-user": "auth.errors.firebase.popupClosed",
};

/** Extracts a user-facing message from an API/Firebase error, falling back to a generic string. */
export function getAuthErrorMessage(
  error: unknown,
  fallback: string,
  t?: (key: string) => string
): string {
  if (isAxiosError(error)) {
    const data = error.response?.data as { message?: string | string[] } | undefined;
    if (Array.isArray(data?.message)) return data.message.join(" ");
    if (typeof data?.message === "string") return data.message;
  }
  if (error && typeof error === "object" && "code" in error) {
    const code = String((error as { code: unknown }).code);
    if (FIREBASE_ERROR_KEYS[code] && t) return t(FIREBASE_ERROR_KEYS[code]);
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

/** Resolves the FCM token, but never blocks login longer than 5s on a stalled permission prompt. */
export async function ensureFcmToken(): Promise<string | undefined> {
  const timeout = new Promise<undefined>((resolve) => setTimeout(() => resolve(undefined), 5000));
  const token = await Promise.race([fetchFcmToken(), timeout]);
  return token ?? undefined;
}

export function useCustomerAuth() {
  const dispatch = useAppDispatch();

  const verifyIdentity = async (params: {
    mode: IdentifierMode;
    value: string;
    countryCode: string;
    passwordUpdate: "0" | "1";
    loginType: string;
    uid?: string;
  }): Promise<VerifyUserResponse> => {
    return verifyUserApi({
      ...identityBody(params.mode, params.value, params.countryCode),
      password_update: params.passwordUpdate,
      login_type: params.loginType,
      uid: params.uid,
    });
  };

  const sendOtp = async (params: {
    mode: IdentifierMode;
    value: string;
    countryCode: string;
    authenticationMode: AuthenticationMode;
    loginType: string;
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
    const response = await resendOTPApi({
      ...identityBody(params.mode, params.value, params.countryCode),
      login_type: params.loginType,
    });
    if (response?.error) throw new Error(response.message ?? "Failed to send verification code.");
  };

  const verifyOtp = async (params: {
    mode: IdentifierMode;
    value: string;
    countryCode: string;
    otp: string;
    authenticationMode: AuthenticationMode;
    passwordUpdate: "0" | "1";
    loginType: string;
  }): Promise<VerifyOtpResponse> => {
    if (params.mode === "phone" && params.authenticationMode === "firebase") {
      if (!window.confirmationResult) {
        throw new Error("Your verification session expired, please request a new code.");
      }
      await window.confirmationResult.confirm(params.otp);
      return { error: false, message: "" };
    }
    return verifyOTPApi({
      ...identityBody(params.mode, params.value, params.countryCode),
      otp: params.otp,
      password_update: params.passwordUpdate,
      login_type: params.loginType,
    });
  };

  const loginOrRegister = async (
    params: Record<string, string | number | boolean | undefined>
  ): Promise<ManageUserResponse> => {
    const fcmId = await ensureFcmToken();
    const response: ManageUserResponse = await manageUserApi({ ...params, web_fcm_id: fcmId });
    if (!response?.error && response?.token) {
      dispatch(setToken(response.token));
      if (response.data) dispatch(setUserData(response.data));
      // get_settings only includes payment_gateways_settings for an
      // authenticated request — AppBootstrap's own fetch ran as a guest
      // (before this token existed) and nothing re-triggers it, so refresh
      // here to pick up the authenticated gateway config right away instead
      // of leaving checkout's "Pay on Service only" fallback until its own
      // lazy refetch happens to run.
      getSettingsApi().then((settingsResponse) => {
        if (settingsResponse?.data) dispatch(setSettings(settingsResponse.data));
      });
    }
    return response;
  };

  const setPassword = async (
    params: Record<string, string | undefined>
  ): Promise<ChangePasswordResponse> => {
    return changePasswordApi(params);
  };

  const googleSignIn = async (): Promise<{
    uid: string;
    email?: string;
    displayName?: string;
  }> => {
    const { signInWithPopup } = await import("firebase/auth");
    const result = await signInWithPopup(getFirebaseAuth(), googleProvider);
    return {
      uid: result.user.uid,
      email: result.user.email ?? undefined,
      displayName: result.user.displayName ?? undefined,
    };
  };

  return { verifyIdentity, sendOtp, verifyOtp, loginOrRegister, setPassword, googleSignIn };
}
