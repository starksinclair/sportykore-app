import type { QueryClient } from "@tanstack/react-query";

import type {
  ApiGame,
  ApiGameDetail,
  ApiLeagueDetail,
  ApiPlayerDetail,
  ApiTeamDetail,
} from "@/api/entities";
import type { LeagueResponse } from "@/home/types";
import { isLiveGameStatus } from "@/lib/general-utils";

function addLiveGame(games: ApiGame[] | undefined, ids: Set<number>): void {
  for (const game of games ?? []) {
    if (isLiveGameStatus(game.status)) {
      ids.add(game.id);
    }
  }
}

function collectFromHomeLeagues(data: unknown, ids: Set<number>): void {
  const response = data as LeagueResponse;
  const countries = [
    ...(response.matches ?? []),
    ...(response.leagues ?? []),
  ];
  for (const country of countries) {
    for (const league of country.leagues ?? []) {
      addLiveGame(league.games, ids);
    }
  }
}

function collectFromLeagueDetail(data: unknown, ids: Set<number>): void {
  const detail = data as ApiLeagueDetail;
  addLiveGame(detail.season?.games, ids);
}

function collectFromPlayerDetail(data: unknown, ids: Set<number>): void {
  const detail = data as ApiPlayerDetail;
  for (const league of detail.leagues ?? []) {
    for (const season of league.seasons ?? []) {
      addLiveGame(season.games, ids);
    }
  }
}

function collectFromTeamDetail(data: unknown, ids: Set<number>): void {
  const detail = data as ApiTeamDetail;
  for (const league of detail.leagues ?? []) {
    for (const season of league.seasons ?? []) {
      addLiveGame(season.games, ids);
    }
  }
}

function collectFromManageLeague(data: unknown, ids: Set<number>): void {
  const detail = data as { season?: { games?: ApiGame[] } };
  addLiveGame(detail.season?.games, ids);
}

export function collectSubscribableGameIds(
  queryClient: QueryClient,
  listenerGameIds: ReadonlySet<number>,
): Set<number> {
  const ids = new Set<number>(listenerGameIds);

  for (const query of queryClient.getQueryCache().getAll()) {
    const key = query.queryKey;
    const data = query.state.data;
    if (!data) continue;

    if (key[0] === "home" && key[1] === "leagues") {
      collectFromHomeLeagues(data, ids);
      continue;
    }

    if (key[0] === "league") {
      collectFromLeagueDetail(data, ids);
      continue;
    }

    if (key[0] === "player") {
      collectFromPlayerDetail(data, ids);
      continue;
    }

    if (key[0] === "team") {
      collectFromTeamDetail(data, ids);
      continue;
    }

    if (key[0] === "manage" && key[1] === "league") {
      collectFromManageLeague(data, ids);
      continue;
    }

    if (key[0] === "match" && typeof key[1] === "number") {
      const gameId = key[1];
      if (query.getObserversCount() > 0) {
        ids.add(gameId);
        continue;
      }
      const match = data as ApiGameDetail;
      if (isLiveGameStatus(match.status)) {
        ids.add(gameId);
      }
    }
  }

  return ids;
}
