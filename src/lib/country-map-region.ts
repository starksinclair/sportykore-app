export type CountryMapRegion = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

export type CountryMapRef = {
  code?: string | null;
  name?: string | null;
};

const STATIC_COUNTRY_REGIONS: Record<string, CountryMapRegion> = {
  AO: { latitude: -11.2027, longitude: 17.8739, latitudeDelta: 9, longitudeDelta: 9 },
  BJ: { latitude: 9.3077, longitude: 2.3158, latitudeDelta: 4, longitudeDelta: 4 },
  BF: { latitude: 12.2383, longitude: -1.5616, latitudeDelta: 5, longitudeDelta: 5 },
  BI: { latitude: -3.3731, longitude: 29.9189, latitudeDelta: 3, longitudeDelta: 3 },
  CM: { latitude: 7.3697, longitude: 12.3547, latitudeDelta: 6, longitudeDelta: 6 },
  CV: { latitude: 16.5388, longitude: -23.0418, latitudeDelta: 3, longitudeDelta: 3 },
  CF: { latitude: 6.6111, longitude: 20.9394, latitudeDelta: 6, longitudeDelta: 6 },
  TD: { latitude: 15.4542, longitude: 18.7322, latitudeDelta: 9, longitudeDelta: 9 },
  KM: { latitude: -11.875, longitude: 43.8722, latitudeDelta: 2, longitudeDelta: 2 },
  CG: { latitude: -0.228, longitude: 15.8277, latitudeDelta: 5, longitudeDelta: 5 },
  CD: { latitude: -4.0383, longitude: 21.7587, latitudeDelta: 10, longitudeDelta: 10 },
  CI: { latitude: 7.54, longitude: -5.5471, latitudeDelta: 5, longitudeDelta: 5 },
  DJ: { latitude: 11.8251, longitude: 42.5903, latitudeDelta: 2, longitudeDelta: 2 },
  EG: { latitude: 26.8206, longitude: 30.8025, latitudeDelta: 8, longitudeDelta: 8 },
  GQ: { latitude: 1.6508, longitude: 10.2679, latitudeDelta: 3, longitudeDelta: 3 },
  ER: { latitude: 15.1794, longitude: 39.7823, latitudeDelta: 4, longitudeDelta: 4 },
  SZ: { latitude: -26.5225, longitude: 31.4659, latitudeDelta: 2, longitudeDelta: 2 },
  ET: { latitude: 9.145, longitude: 40.4897, latitudeDelta: 7, longitudeDelta: 7 },
  GA: { latitude: -0.8037, longitude: 11.6094, latitudeDelta: 4, longitudeDelta: 4 },
  GM: { latitude: 13.4432, longitude: -15.3101, latitudeDelta: 2, longitudeDelta: 2 },
  GH: { latitude: 7.9465, longitude: -1.0232, latitudeDelta: 5, longitudeDelta: 5 },
  GN: { latitude: 9.9456, longitude: -9.6966, latitudeDelta: 5, longitudeDelta: 5 },
  GW: { latitude: 11.8037, longitude: -15.1804, latitudeDelta: 3, longitudeDelta: 3 },
  KE: { latitude: -0.0236, longitude: 37.9062, latitudeDelta: 6, longitudeDelta: 6 },
  LS: { latitude: -29.61, longitude: 28.2336, latitudeDelta: 2, longitudeDelta: 2 },
  LR: { latitude: 6.4281, longitude: -9.4295, latitudeDelta: 3, longitudeDelta: 3 },
  LY: { latitude: 26.3351, longitude: 17.2283, latitudeDelta: 8, longitudeDelta: 8 },
  MG: { latitude: -18.7669, longitude: 46.8691, latitudeDelta: 7, longitudeDelta: 7 },
  MW: { latitude: -13.2543, longitude: 34.3015, latitudeDelta: 4, longitudeDelta: 4 },
  ML: { latitude: 17.5707, longitude: -3.9962, latitudeDelta: 8, longitudeDelta: 8 },
  MR: { latitude: 21.0079, longitude: -10.9408, latitudeDelta: 7, longitudeDelta: 7 },
  MU: { latitude: -20.3484, longitude: 57.5522, latitudeDelta: 2, longitudeDelta: 2 },
  MA: { latitude: 31.7917, longitude: -7.0926, latitudeDelta: 6, longitudeDelta: 6 },
  MZ: { latitude: -18.6657, longitude: 35.5296, latitudeDelta: 8, longitudeDelta: 8 },
  NA: { latitude: -22.9576, longitude: 18.4904, latitudeDelta: 7, longitudeDelta: 7 },
  NE: { latitude: 17.6078, longitude: 8.0817, latitudeDelta: 7, longitudeDelta: 7 },
  NG: { latitude: 9.0765, longitude: 7.3986, latitudeDelta: 6, longitudeDelta: 6 },
  RW: { latitude: -1.9403, longitude: 29.8739, latitudeDelta: 2, longitudeDelta: 2 },
  ST: { latitude: 0.1864, longitude: 6.6131, latitudeDelta: 2, longitudeDelta: 2 },
  SN: { latitude: 14.4974, longitude: -14.4524, latitudeDelta: 4, longitudeDelta: 4 },
  SC: { latitude: -4.6796, longitude: 55.492, latitudeDelta: 2, longitudeDelta: 2 },
  SL: { latitude: 8.4606, longitude: -11.7799, latitudeDelta: 3, longitudeDelta: 3 },
  SO: { latitude: 5.1521, longitude: 46.1996, latitudeDelta: 7, longitudeDelta: 7 },
  ZA: { latitude: -30.5595, longitude: 22.9375, latitudeDelta: 7, longitudeDelta: 7 },
  SS: { latitude: 6.877, longitude: 31.307, latitudeDelta: 6, longitudeDelta: 6 },
  SD: { latitude: 12.8628, longitude: 30.2176, latitudeDelta: 8, longitudeDelta: 8 },
  TZ: { latitude: -6.369, longitude: 34.8888, latitudeDelta: 7, longitudeDelta: 7 },
  TG: { latitude: 8.6195, longitude: 0.8248, latitudeDelta: 4, longitudeDelta: 4 },
  TN: { latitude: 33.8869, longitude: 9.5375, latitudeDelta: 5, longitudeDelta: 5 },
  UG: { latitude: 1.3733, longitude: 32.2903, latitudeDelta: 5, longitudeDelta: 5 },
  ZM: { latitude: -13.1339, longitude: 27.8493, latitudeDelta: 6, longitudeDelta: 6 },
  ZW: { latitude: -19.0154, longitude: 29.1549, latitudeDelta: 5, longitudeDelta: 5 },
  CA: { latitude: 56.1304, longitude: -106.3468, latitudeDelta: 20, longitudeDelta: 20 },
  GB: { latitude: 54.7024, longitude: -3.2766, latitudeDelta: 8, longitudeDelta: 8 },
  US: { latitude: 39.8283, longitude: -98.5795, latitudeDelta: 20, longitudeDelta: 20 },
};

const geocodeCache = new Map<string, CountryMapRegion | null>();

export function staticCountryMapRegion(country?: CountryMapRef | null) {
  const code = normalizeCountryCode(country?.code);
  return code ? STATIC_COUNTRY_REGIONS[code] ?? null : null;
}

export async function resolveCountryMapRegion(
  country: CountryMapRef | null | undefined,
  apiKey: string | undefined,
): Promise<CountryMapRegion | null> {
  const staticRegion = staticCountryMapRegion(country);
  const code = normalizeCountryCode(country?.code);
  const name = country?.name?.trim();
  if (!apiKey || (!code && !name)) return staticRegion;

  const cacheKey = `${code ?? ""}:${name ?? ""}`.toLowerCase();
  if (geocodeCache.has(cacheKey)) {
    return geocodeCache.get(cacheKey) ?? staticRegion;
  }

  try {
    const params = new URLSearchParams({
      key: apiKey,
    });
    if (name) params.set("address", name);
    if (code) params.set("components", `country:${code.toLowerCase()}`);

    const res = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?${params.toString()}`,
    );
    const body = (await res.json()) as GoogleGeocodeResponse;
    const first = body.results?.[0];
    const geometry = first?.geometry;
    const location = geometry?.location;
    if (!geometry || !location) {
      geocodeCache.set(cacheKey, null);
      return staticRegion;
    }

    const viewport = geometry.viewport;
    const region = {
      latitude: location.lat,
      longitude: location.lng,
      latitudeDelta: viewport
        ? Math.max(1, Math.abs(viewport.northeast.lat - viewport.southwest.lat))
        : (staticRegion?.latitudeDelta ?? 6),
      longitudeDelta: viewport
        ? Math.max(1, Math.abs(viewport.northeast.lng - viewport.southwest.lng))
        : (staticRegion?.longitudeDelta ?? 6),
    };
    geocodeCache.set(cacheKey, region);
    return region;
  } catch {
    geocodeCache.set(cacheKey, null);
    return staticRegion;
  }
}

function normalizeCountryCode(code?: string | null) {
  const trimmed = code?.trim();
  return trimmed ? trimmed.toUpperCase() : null;
}

type GoogleGeocodeResponse = {
  results?: {
    geometry?: {
      location?: { lat: number; lng: number };
      viewport?: {
        northeast: { lat: number; lng: number };
        southwest: { lat: number; lng: number };
      };
    };
  }[];
};
