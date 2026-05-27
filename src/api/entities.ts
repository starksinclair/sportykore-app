/**
 * Shared API entity shapes mirroring `documentations/ROUTES.md` transformers.
 * Detail screens (league, team, player, match) consume these as the single
 * source of truth for response types.
 */

export type ApiCountry = {
  id: number;
  name: string;
  code: string;
};

export type ApiLeague = {
  id: number;
  name: string;
  logoUrl: string | null;
  games?: ApiGame[];
  description: string;
};

export type ApiTeam = {
  id: number;
  name: string;
  logoUrl: string | null;
};

export type PlayerPosition = "attack" | "defence" | "midfield" | "goalkeeper";

export type ApiPlayer = {
  id: number;
  name: string;
  avatarUrl: string | null;
  position?: PlayerPosition | null;
};

export type ApiStatType = {
  id: number;
  name: string;
  displayName: string;
  iconName: string | null;
  category: string | null;
};

export type ApiStat = {
  id: number;
  minute: number | null;
  isStoppageTime: boolean | null;
  numericValue: number | null;
  type?: ApiStatType;
  team?: ApiTeam;
  player?: ApiPlayer;
  relatedPlayer?: ApiPlayer;
};

export type ApiPlayerWithStats = ApiPlayer & {
  stats: ApiStat[];
};

export type ApiStanding = {
  id: number;
  position: number;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  form: string | null;
  team?: ApiTeam;
};

export type GameStatus =
  | "scheduled"
  | "live"
  | "break"
  | "completed"
  | "postponed"
  | "cancelled";

export type ApiGame = {
  id: number;
  status: GameStatus;
  playedAt: string;
  homeScore: number | null;
  awayScore: number | null;
  venueName: string | null;
  currentMinute: number;
  homeTeam?: ApiTeam;
  awayTeam?: ApiTeam;
};

export type ApiGameDetail = ApiGame & {
  league?: ApiLeague;
  stats: ApiStat[];
};

export type SeasonStatus = "inactive" | "active" | "completed";

export type ApiSeason = {
  id: number;
  name: string;
  status: SeasonStatus;
};

export type ApiSeasonDetail = ApiSeason & {
  league: ApiLeague;
  games: ApiGame[];
  standings: ApiStanding[];
  stats: ApiStat[];
};

/** Wire shape of `GET /api/v1/leagues/:leagueId` — the available seasons plus the active season detail. */
export type ApiLeagueDetail = {
  seasons: ApiSeason[];
  season: ApiSeasonDetail;
  statTypes: ApiStatType[];
};

export type ApiTeamSeason = {
  id: number;
  name: string;
  status: SeasonStatus;
  // Backend may omit these arrays when empty, so consumers must default to `[]`.
  games?: ApiGame[];
  standings?: ApiStanding[];
  players?: ApiPlayerWithStats[];
};

export type ApiTeamLeague = {
  id: number;
  name: string;
  logoUrl: string | null;
  seasons: ApiTeamSeason[];
};

/** Wire shape of `GET /api/v1/teams/:id`. Mirrors player detail: league → season grouping. */
export type ApiTeamDetail = {
  team: ApiTeam;
  statTypes: ApiStatType[];
  leagues: ApiTeamLeague[];
};

export type ApiPlayerSeason = {
  id: number;
  name: string;
  status: SeasonStatus;
  team: ApiTeam;
  // The backend may omit these arrays when empty, so consumers must default to `[]`.
  games?: ApiGame[];
  stats?: ApiStat[];
};

export type ApiPlayerLeague = {
  id: number;
  name: string;
  logoUrl: string | null;
  seasons: ApiPlayerSeason[];
};

/** Wire shape of `GET /api/v1/players/:id`. Stats and games are grouped per league → season. */
export type ApiPlayerDetail = {
  player: ApiPlayer & { country: ApiCountry | null };
  statTypes: ApiStatType[];
  leagues: ApiPlayerLeague[];
};
