import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export interface AuthUser {
  id: number | string;
  username?: string;
  email?: string;
  phone?: string;
  country_code?: string;
  image?: string;
  // API field is snake_case (matches the login_type param sent to verify/manage-user) —
  // camelCase loginType here silently never matched it, so every "is this a google
  // account" check downstream always fell through.
  login_type?: string;
  [key: string]: unknown;
}

/** Intermediate identity captured mid-flow (post-OTP/Google, pre-registration) — not yet a logged-in user. */
export interface PendingAuthData {
  loginType: string;
  email?: string;
  mobile?: string;
  countryCode?: string;
  uid?: string;
  username?: string;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  pending: PendingAuthData | null;
}

const initialState: AuthState = {
  user: null,
  token: null,
  pending: null,
};

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setToken: (state, action: PayloadAction<string | null>) => {
      state.token = action.payload;
    },
    setUserData: (state, action: PayloadAction<AuthUser>) => {
      state.user = action.payload;
    },
    updateUserData: (state, action: PayloadAction<Partial<AuthUser>>) => {
      if (state.user) Object.assign(state.user, action.payload);
    },
    setPendingAuthData: (state, action: PayloadAction<PendingAuthData | null>) => {
      state.pending = action.payload;
    },
    clearAuth: (state) => {
      state.user = null;
      state.token = null;
      state.pending = null;
    },
  },
});

export const { setToken, setUserData, updateUserData, setPendingAuthData, clearAuth } =
  authSlice.actions;
export default authSlice.reducer;
