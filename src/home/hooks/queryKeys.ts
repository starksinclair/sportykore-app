import type { ResolvedLeaguesParams, SearchParams } from "../types";

export const homeKeys = {
  all: ["home"] as const,
  leagues: (params: ResolvedLeaguesParams) =>
    ["home", "leagues", params] as const,
  search: (params: SearchParams) => ["home", "search", params] as const,
};
