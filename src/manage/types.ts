import type {
  GameStatus as ApiGameStatus,
  ApiPlayer,
  ApiSeason,
  ApiTeam,
  PlayerPosition,
  SeasonStatus,
} from "@/api/entities";

export type OwnedLeague = {
  id: number;
  name: string;
  logoUrl: string | null;
  countryId: number;
  activeSeason?: {
    id: number;
    name: string;
    status: SeasonStatus;
  } | null;
};

export type LeagueRosterRow = {
  id: number;
  status: string;
  position: PlayerPosition | null;
  jerseyNumber: string | null;
  isCaptain: boolean;
  player: ApiPlayer;
  team: ApiTeam;
};

export type CreateGamePayload = {
  leagueId: number;
  seasonId: number;
  homeTeamId: number;
  awayTeamId: number;
  playedAt: string;
  venueName?: string;
  status?: ApiGameStatus;
  homeScore?: number | null;
  awayScore?: number | null;
};

export type UpdateGamePayload = {
  homeScore?: number | null;
  awayScore?: number | null;
  currentMinute?: number;
  status?: ApiGameStatus;
  playedAt?: string;
  venueName?: string | null;
};

export type CreateStatPayload = {
  gameId: number;
  leagueId: number;
  seasonId: number;
  teamId: number;
  playerId: number;
  statTypeId: number;
  relatedPlayerId?: number;
  minute?: number;
  isStoppageTime?: boolean;
};

export type UpdateLeaguePayload = {
  name?: string;
  description?: string | null;
  gender?: string | null;
};

export type CreateSeasonPayload = {
  leagueId: number;
  name: string;
  status: SeasonStatus;
};

export type CreatedSeason = ApiSeason & {
  leagueId: number;
  createdAt?: string;
  updatedAt?: string;
};

export const GameStatus = {
  Scheduled: "scheduled",
  Live: "live",
  Break: "break",
  Completed: "completed",
  Postponed: "postponed",
  Cancelled: "cancelled",
} as const;

export const SeasonStatusEnum = {
  Inactive: "inactive",
  Active: "active",
  Completed: "completed",
} as const;

export const RosterPosition = {
  Attack: "attack",
  Defence: "defence",
  Midfield: "midfield",
  Goalkeeper: "goalkeeper",
} as const;

/** Map statTypes[].name to Match Center actions. */
export const MatchEventStatName = {
  Goal: "goals",
  Assist: "assists",
  OwnGoal: "own_goal",
  Yellow: "yellow_card",
  Red: "red_card",
} as const;

export type MatchEventKey = keyof typeof MatchEventStatName;
