export const lineupKeys = {
  all: ["lineup"] as const,
  formations: () => [...lineupKeys.all, "formations"] as const,
  gameLineups: (gameId: number) => [...lineupKeys.all, "game", gameId] as const,
};
