// POST /request_area_coverage — customer asks for service in an unserved area.
export interface RequestAreaCoverageResponse {
  error: boolean;
  message: string;
  data: null;
  code: number;
}

// GET /get_places_for_web?input=<query> — Google Places Autocomplete proxy.
export interface PlacePrediction {
  description: string;
  place_id: string;
  structured_formatting: {
    main_text: string;
    secondary_text?: string;
  };
}

export interface PlacesForWebResponse {
  error: boolean;
  data: {
    predictions: PlacePrediction[];
  };
}

// GET /get_place_details_for_web?place_id=<id> — Google Place Details proxy.
export interface PlaceDetailsByIdResponse {
  error: boolean;
  data: {
    result: {
      formatted_address: string;
      geometry: {
        location: { lat: number; lng: number };
      };
    };
  };
}

// GET /get_place_details_for_web?latitude=<lat>&longitude=<lng> — reverse geocode proxy.
// Backend has been observed returning either shape for this same call: a `results`
// array with flat `geometry.{lat,lng}`, or a singular `result` with nested
// `geometry.location.{lat,lng}` (same shape the place_id form uses). Handle both.
type ReverseGeocodeGeometry = { lat: number; lng: number } | { location: { lat: number; lng: number } };

export interface AddressComponent {
  long_name: string;
  short_name: string;
  types: string[];
}

export interface PlaceDetailsByLatLngResponse {
  error: boolean;
  data: {
    results?: {
      formatted_address: string;
      geometry: ReverseGeocodeGeometry;
      address_components?: AddressComponent[];
    }[];
    result?: {
      formatted_address: string;
      geometry: ReverseGeocodeGeometry;
      address_components?: AddressComponent[];
    };
  };
}

function resolveGeometry(geometry: ReverseGeocodeGeometry): { lat: number; lng: number } {
  return "location" in geometry ? geometry.location : geometry;
}

export function extractReverseGeocodeResult(
  response: PlaceDetailsByLatLngResponse | undefined
): { formatted_address: string; lat: number; lng: number; addressComponents: AddressComponent[] } | null {
  const fromArray = response?.data?.results?.[0];
  if (fromArray) {
    const { lat, lng } = resolveGeometry(fromArray.geometry);
    return {
      formatted_address: fromArray.formatted_address,
      lat,
      lng,
      addressComponents: fromArray.address_components ?? [],
    };
  }
  const single = response?.data?.result;
  if (single) {
    const { lat, lng } = resolveGeometry(single.geometry);
    return {
      formatted_address: single.formatted_address,
      lat,
      lng,
      addressComponents: single.address_components ?? [],
    };
  }
  return null;
}

/** The full (not abbreviated — Google shortens "United Kingdom" to "UK" in
 * formatted_address, "United States" to "USA", etc.) name for a given
 * address_components type, e.g. "country" or "administrative_area_level_1". */
export function addressComponentLongName(
  components: AddressComponent[],
  type: string
): string | null {
  return components.find((component) => component.types.includes(type))?.long_name ?? null;
}
