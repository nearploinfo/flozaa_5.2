import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { CartGroup } from "@/lib/cart-types";

interface ReorderState {
  orderId: number | null;
  cartGroup: CartGroup | null;
}

const initialState: ReorderState = {
  orderId: null,
  cartGroup: null,
};

export const reorderSlice = createSlice({
  name: "reorder",
  initialState,
  reducers: {
    setReorderCartGroup: (state, action: PayloadAction<{ orderId: number; cartGroup: CartGroup }>) => {
      state.orderId = action.payload.orderId;
      state.cartGroup = action.payload.cartGroup;
    },
    clearReorderCartGroup: (state) => {
      state.orderId = null;
      state.cartGroup = null;
    },
  },
});

export const { setReorderCartGroup, clearReorderCartGroup } = reorderSlice.actions;
export default reorderSlice.reducer;
