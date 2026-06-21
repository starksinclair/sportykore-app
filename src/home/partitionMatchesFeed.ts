import type { ApiCountry } from "@/api/entities";

import type { ApiCountryWithLeagues, ApiLeague } from "./types";

export type FavoriteLeagueEntry = {
  key: string;
  country: Pick<ApiCountry, "id" | "name" | "code">;
  league: ApiLeague;
};

export function partitionMatchesFeed(matches: ApiCountryWithLeagues[]): {
  favourites: FavoriteLeagueEntry[];
  others: ApiCountryWithLeagues[];
} {
  const favourites: FavoriteLeagueEntry[] = [];

  for (const country of matches) {
    for (const league of country.leagues) {
      if (!league.isFavourited) continue;
      favourites.push({
        key: `${country.id}-${league.id}`,
        country: {
          id: country.id,
          name: country.name,
          code: country.code,
        },
        league,
      });
    }
  }

  const others = matches
    .map((country) => ({
      ...country,
      leagues: country.leagues.filter((league) => !league.isFavourited),
    }))
    .filter((country) => country.leagues.length > 0);

  return { favourites, others };
}
