import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { CountrySettingsApi } from "@/api/apiRoutes";

interface CountrySettingsState {
  data: CountrySettingsApi | null;
}

const initialState: CountrySettingsState = {
  data: null,
};

export const countrySettingsSlice = createSlice({
  name: "countrySettings",
  initialState,
  reducers: {
    setCountrySettings: (state, action: PayloadAction<CountrySettingsApi>) => {
      state.data = action.payload;
    },
    clearCountrySettings: (state) => {
      state.data = null;
    },
  },
});

export const { setCountrySettings, clearCountrySettings } = countrySettingsSlice.actions;
export default countrySettingsSlice.reducer;
