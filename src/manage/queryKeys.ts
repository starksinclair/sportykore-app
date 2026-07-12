export const manageKeys = {
  all: ["manage"] as const,
  managed: () => [...manageKeys.all, "managed"] as const,
  leagues: () => [...manageKeys.all, "leagues"] as const,
  league: (leagueId: number, seasonId?: number | null) =>
    [...manageKeys.all, "league", leagueId, seasonId ?? null] as const,
  teams: (leagueId: number) => [...manageKeys.all, "teams", leagueId] as const,
  roster: (leagueId: number, seasonId: number) =>
    [...manageKeys.all, "roster", leagueId, seasonId] as const,
};
