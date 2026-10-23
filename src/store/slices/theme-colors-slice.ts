import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { ThemeColorsData } from "@/lib/theme-colors";

interface ThemeColorsState {
  data: ThemeColorsData | null;
}

const initialState: ThemeColorsState = {
  data: null,
};

export const themeColorsSlice = createSlice({
  name: "themeColors",
  initialState,
  reducers: {
    setThemeColors: (state, action: PayloadAction<ThemeColorsData>) => {
      state.data = action.payload;
    },
  },
});

export const { setThemeColors } = themeColorsSlice.actions;
export default themeColorsSlice.reducer;
