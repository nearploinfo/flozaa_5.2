import { configureStore, combineReducers, type Middleware } from "@reduxjs/toolkit";
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from "redux-persist";
import storage from "redux-persist/lib/storage";
import locationReducer, { setLocation } from "@/store/slices/location-slice";
import authReducer, { clearAuth } from "@/store/slices/auth-slice";
import settingsReducer from "@/store/slices/settings-slice";
import countrySettingsReducer, { clearCountrySettings } from "@/store/slices/country-settings-slice";
import themeColorsReducer from "@/store/slices/theme-colors-slice";
import authModalReducer from "@/store/slices/auth-modal-slice";
import cartReducer, { clearCart } from "@/store/slices/cart-slice";
import customJobReducer, { clearCustomJobData } from "@/store/slices/custom-job-slice";
import reorderReducer, { clearReorderCartGroup } from "@/store/slices/reorder-slice";
import chatUIReducer from "@/store/slices/chat-ui-slice";
import { LOCATION_COOKIE_NAME, serializeLocationCookie } from "@/lib/location-cookie";

const rootReducer = combineReducers({
  location: locationReducer,
  auth: authReducer,
  settings: settingsReducer,
  countrySettings: countrySettingsReducer,
  themeColors: themeColorsReducer,
  authModal: authModalReducer,
  cart: cartReducer,
  customJob: customJobReducer,
  reorder: reorderReducer,
  chatUI: chatUIReducer,
});

// Location is no longer in the redux-persist whitelist below — a cookie is
// the persistence layer instead (see lib/location-cookie.ts), because the
// server needs to read it too (SSR fetches in page.tsx via cookies()), and
// localStorage is invisible to the server. This middleware is the single
// place that keeps the cookie in sync with every setLocation dispatch, so
// future dispatch sites can't forget to write it.
const locationCookieMiddleware: Middleware = () => (next) => (action) => {
  const result = next(action);
  if (setLocation.match(action) && typeof document !== "undefined") {
    document.cookie = action.payload
      ? `${LOCATION_COOKIE_NAME}=${serializeLocationCookie(action.payload)}; path=/; max-age=31536000`
      : `${LOCATION_COOKIE_NAME}=; path=/; max-age=0`;
  }
  return result;
};

// Cart is server-authoritative and user-scoped — clear it on logout so a
// subsequent sign-in (possibly a different user, on a shared device) never
// briefly shows the previous session's cart before the next fetch lands.
const clearCartOnLogoutMiddleware: Middleware = (store) => (next) => (action) => {
  const result = next(action);
  if (clearAuth.match(action)) {
    store.dispatch(clearCart());
    store.dispatch(clearCustomJobData());
    store.dispatch(clearReorderCartGroup());
    // Payment gateways / cod_setting resolved while authenticated must not
    // leak to the next guest (or different user) on a shared device — the
    // next useCountrySettings fetch (keyed on auth below) refills it.
    store.dispatch(clearCountrySettings());
  }
  return result;
};

const persistConfig = {
  key: "edemand-root",
  storage,
  whitelist: ["auth", "themeColors", "settings"],
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }).concat(locationCookieMiddleware, clearCartOnLogoutMiddleware),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = typeof store.dispatch;
