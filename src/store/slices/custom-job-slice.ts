import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export interface CustomJobData {
  customJobRequestId: number;
  bidderId: number;
  companyName: string;
  providerImage?: string;
  counterPrice: number;
  duration?: string;
  serviceTitle?: string;
  atDoorstep: boolean;
  atStore: boolean;
  providerLatitude?: number;
  providerLongitude?: number;
}

interface CustomJobState {
  data: CustomJobData | null;
}

const initialState: CustomJobState = {
  data: null,
};

export const customJobSlice = createSlice({
  name: "customJob",
  initialState,
  reducers: {
    setCustomJobData: (state, action: PayloadAction<CustomJobData>) => {
      state.data = action.payload;
    },
    clearCustomJobData: (state) => {
      state.data = null;
    },
  },
});

export const { setCustomJobData, clearCustomJobData } = customJobSlice.actions;
export default customJobSlice.reducer;
