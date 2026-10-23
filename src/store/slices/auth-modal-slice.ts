import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type AuthModalMode = "signin" | "signup";

interface AuthModalState {
  open: boolean;
  mode: AuthModalMode;
  /** Mobile-only "Login Required" bottom sheet shown before the sign-in form
   * for gated actions/pages (see useRequireAuth, withAuth). */
  gateOpen: boolean;
}

const initialState: AuthModalState = {
  open: false,
  mode: "signin",
  gateOpen: false,
};

export const authModalSlice = createSlice({
  name: "authModal",
  initialState,
  reducers: {
    openAuthModal: (state, action: PayloadAction<AuthModalMode | undefined>) => {
      state.open = true;
      state.mode = action.payload ?? "signin";
      state.gateOpen = false;
    },
    closeAuthModal: (state) => {
      state.open = false;
    },
    switchAuthMode: (state, action: PayloadAction<AuthModalMode>) => {
      state.mode = action.payload;
    },
    openLoginGate: (state) => {
      state.gateOpen = true;
    },
    closeLoginGate: (state) => {
      state.gateOpen = false;
    },
  },
});

export const {
  openAuthModal,
  closeAuthModal,
  switchAuthMode,
  openLoginGate,
  closeLoginGate,
} = authModalSlice.actions;
export default authModalSlice.reducer;
