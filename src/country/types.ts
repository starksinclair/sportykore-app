import type { ApiCountry } from "@/api/entities";
import type { CountryRef, LeagueRef, TeamRef } from "@/home/types";

export type CountryPlayerHighlight = {
  player: {
    id: string;
    name: string;
    avatarInitials: string;
    position: string;
    teamId?: string;
    countryCode?: string;
  };
  goals: number;
  assists: number;
  appearances: number;
  yellowCards: number;
  redCards: number;
};

export type CountryMatchSummary = {
  id: string;
  homeTeam: TeamRef;
  awayTeam: TeamRef;
  league: LeagueRef;
  country: CountryRef;
  scoreline: string;
  status: string;
  kickoffLabel: string;
  venue: string;
  round: string;
  live: boolean;
  isoDate: string;
};

export type CountryDetail = {
  country: CountryRef;
  stats: {
    leagues: number;
    teams: number;
    players: number;
    liveMatches: number;
  };
  leagues: LeagueRef[];
  teams: TeamRef[];
  featuredPlayers: CountryPlayerHighlight[];
  recentMatches: CountryMatchSummary[];
};

/** Wire shape from `GET /api/v1/countries/:idOrCode` → `{ data: … }`. */
export type ApiCountryDetail = {
  country: ApiCountry;
  stats: {
    leagues: number;
    teams: number;
    players: number;
    liveMatches: number;
  };
  leagues: {
    id: number | string;
    name: string;
    logoUrl?: string | null;
    country?: CountryRef;
  }[];
  teams: {
    id: number | string;
    name: string;
    logoUrl?: string | null;
  }[];
  featuredPlayers: {
    player: {
      id: number | string;
      name: string;
      avatarInitials?: string;
      position?: string | null;
      teamId?: number | string;
      countryCode?: string;
      avatarUrl?: string | null;
    };
    goals: number;
    assists: number;
    appearances: number;
    yellowCards: number;
    redCards: number;
  }[];
  recentMatches: {
    id: number | string;
    homeTeam: { id: number | string; name: string };
    awayTeam: { id: number | string; name: string };
    league: {
      id: number | string;
      name: string;
      country: CountryRef;
    };
    country: CountryRef;
    scoreline: string;
    status: string;
    kickoffLabel?: string;
    playedAt?: string;
    venue?: string | null;
    round?: string | null;
    live: boolean;
    isoDate?: string;
  }[];
};
