/** Country option shape — populated from the home API (real DB id). */
export type CountryOption = {
  id: number;
  code: string;
  name: string;
};

/** Optional competitive band for reporting later; not enforced by API yet. */
export const DIVISION_OPTIONS = [
  { id: "open", label: "Open / mixed" },
  { id: "mens", label: "Men" },
  { id: "womens", label: "Women" },
] as const;
