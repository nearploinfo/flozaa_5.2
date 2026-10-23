import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { CartData } from "@/lib/cart-types";

type CartStatus = "idle" | "loading" | "loaded" | "error";

interface CartState {
  data: CartData | null;
  status: CartStatus;
}

const initialState: CartState = {
  data: null,
  status: "idle",
};

export const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    setCartData: (state, action: PayloadAction<CartData | null>) => {
      state.data = action.payload;
      state.status = "loaded";
    },
    setCartStatus: (state, action: PayloadAction<CartStatus>) => {
      state.status = action.payload;
    },
    clearCart: (state) => {
      state.data = null;
      state.status = "idle";
    },
  },
});

export const { setCartData, setCartStatus, clearCart } = cartSlice.actions;
export default cartSlice.reducer;
