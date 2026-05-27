import { hasFlag } from "country-flag-icons";
import * as flagSvgs from "country-flag-icons/string/3x2";

const FLAG_SVGS = flagSvgs as Record<string, string>;

export function normalizeCountryCode(code: string): string {
  return code.trim().toUpperCase();
}

export function countryHasFlag(code: string): boolean {
  const normalized = normalizeCountryCode(code);
  return normalized.length === 2 && hasFlag(normalized);
}

export function getCountryFlagSvg(code: string): string | null {
  const normalized = normalizeCountryCode(code);
  if (!countryHasFlag(normalized)) return null;
  return FLAG_SVGS[normalized] ?? null;
}
