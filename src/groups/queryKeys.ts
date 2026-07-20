export const groupsKeys = {
  all: ["groups"] as const,
  standings: (stageId: number) =>
    [...groupsKeys.all, "standings", stageId] as const,
  adjustments: (stageId: number) =>
    [...groupsKeys.all, "adjustments", stageId] as const,
  zones: (stageId: number) => [...groupsKeys.all, "zones", stageId] as const,
  qualifiers: (stageId: number, query: Record<string, unknown>) =>
    [...groupsKeys.all, "qualifiers", stageId, query] as const,
  auditLogs: (leagueId: number, page: number) =>
    [...groupsKeys.all, "audit", leagueId, page] as const,
};
