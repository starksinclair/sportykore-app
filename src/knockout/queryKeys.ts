export const knockoutKeys = {
  all: ["knockout"] as const,
  seasons: () => [...knockoutKeys.all, "seasons"] as const,
  seasonStages: (seasonId: number) =>
    [...knockoutKeys.seasons(), seasonId, "stages"] as const,
  brackets: () => [...knockoutKeys.all, "brackets"] as const,
  bracket: (stageId: number) =>
    [...knockoutKeys.brackets(), stageId] as const,
};
