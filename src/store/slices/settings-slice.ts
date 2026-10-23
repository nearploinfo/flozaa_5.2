import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

interface SettingsState {
  data: Record<string, unknown> | null;
}

const initialState: SettingsState = {
  data: null,
};

export const settingsSlice = createSlice({
  name: "settings",
  initialState,
  reducers: {
    setSettings: (state, action: PayloadAction<Record<string, unknown>>) => {
      state.data = action.payload;
    },
  },
});

export const { setSettings } = settingsSlice.actions;
export default settingsSlice.reducer;
