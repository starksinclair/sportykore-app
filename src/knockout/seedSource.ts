/** Ordered team ids used to seed a knockout bracket (create seed or group→KO). */
export type SeedSource = {
  orderedTeamIds: number[];
};

export function seedSourceFromTeamIds(teamIds: number[]): SeedSource {
  return { orderedTeamIds: teamIds.filter((id) => Number.isFinite(id) && id > 0) };
}
