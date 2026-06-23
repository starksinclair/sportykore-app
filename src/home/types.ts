import type {
  ApiCountry,
  ApiGame,
  ApiLeague as ApiLeagueBase,
  ApiTeam,
  GameStatus,
} from "@/api/entities";

export type { ApiCountry, ApiGame, ApiTeam, GameStatus };

/** ISO 3166-1 alpha-2 code (e.g. NG, GH). */
export type CountryRef = {
  code: string;
  name: string;
};

export type LeagueRef = {
  id: string;
  name: string;
  country: CountryRef;
  logoUrl?: string | null;
};

export type TeamRef = {
  id: string;
  name: string;
  logoUrl?: string;
};

export type MatchStatus =
  | "scheduled"
  | "live"
  | "ht"
  | "ft"
  | "postponed"
  | "canceled";

export type ApiMatch = {
  id: string;
  leagueId: string;
  countryCode: string;
  kickoffAt: string;
  kickoffDisplay: string;
  status: MatchStatus;
  minuteOrPhase: string;
  scoreline: string;
  live: boolean;
  home: TeamRef;
  away: TeamRef;
};

export type SearchEntityType = "player" | "country" | "league" | "team";

export type SearchResult = {
  id: string;
  type: SearchEntityType;
  label: string;
  sublabel?: string;
  countryCode?: string;
  logoUrl?: string | null;
};

export type SearchParams = {
  q: string;
  limit?: number;
};

export type SearchResponse = {
  query: string;
  results: SearchResult[];
};

/** Feed league row — `GET /api/v1/leagues` decorates with `isFavourited` for the matches feed. */
export type ApiLeague = ApiLeagueBase & {
  isFavourited: boolean;
};

export interface ApiCountryWithLeagues extends ApiCountry {
  leagues: ApiLeague[];
}

export type LeagueResponse = {
  matches: ApiCountryWithLeagues[];
  leagues: ApiCountryWithLeagues[];
};

export type FetchLeaguesParams = {
  gameDate?: Date | null;
  countryId?: number | null;
  gameStatus?: string | null;
  timeZone?: string;
};

export type ResolvedLeaguesParams = {
  gameDate: string;
  timeZone: string;
  countryId: number | null;
  gameStatus: string | null;
};
