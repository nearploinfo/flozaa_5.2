import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

interface LocationState {
  current: string | null;
  lat: number | null;
  lng: number | null;
}

const initialState: LocationState = {
  current: null,
  lat: null,
  lng: null,
};

export const locationSlice = createSlice({
  name: "location",
  initialState,
  reducers: {
    setLocation: (
      state,
      action: PayloadAction<{ address: string; lat: number; lng: number } | null>
    ) => {
      state.current = action.payload?.address ?? null;
      state.lat = action.payload?.lat ?? null;
      state.lng = action.payload?.lng ?? null;
    },
  },
});

export const { setLocation } = locationSlice.actions;
export default locationSlice.reducer;
