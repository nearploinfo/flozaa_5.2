import { useAppSelector } from "@/store/hooks";

export function useDistanceUnit(): string {
  const distanceUnit = useAppSelector(
    (state) =>
      (state.settings.data?.general_settings as { distance_unit?: string } | undefined)
        ?.distance_unit
  );
  return distanceUnit ?? "km";
}

