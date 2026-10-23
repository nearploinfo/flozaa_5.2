import { useAppSelector } from "@/store/hooks";

export interface CartSettings {
  max_items_per_provider: number;
  max_carts_per_user: number;
  cart_reminder_interval_minutes: number;
  max_cart_reminders: number;
}

/** cart_settings ships as one group inside the same get_settings payload AppBootstrap already fetches — read it off that store slice instead of a separate call. */
export function useCartSettings(): CartSettings | undefined {
  return useAppSelector(
    (state) => state.settings.data?.cart_settings as CartSettings | undefined
  );
}
