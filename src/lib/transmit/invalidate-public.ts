import type { QueryClient } from "@tanstack/react-query";

export function invalidatePublicLiveGameQueries(
  queryClient: QueryClient,
  gameId: number,
): void {
  queryClient.invalidateQueries({
    predicate: (query) => {
      const root = query.queryKey[0];
      if (root === "manage") return false;
      if (
        root === "home" ||
        root === "league" ||
        root === "player" ||
        root === "team"
      ) {
        return true;
      }
      if (root === "match") return query.queryKey[1] === gameId;
      return false;
    },
  });
}
