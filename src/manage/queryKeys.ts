export const manageKeys = {
  leagues: () => ["manage", "leagues"] as const,
  league: (leagueId: number, seasonId?: number | null) =>
    ["manage", "league", leagueId, seasonId ?? null] as const,
  teams: (leagueId: number) => ["manage", "teams", leagueId] as const,
  roster: (leagueId: number, seasonId: number) =>
    ["manage", "roster", leagueId, seasonId] as const,
};
