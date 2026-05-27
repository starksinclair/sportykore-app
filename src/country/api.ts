import type { ApiCountry } from "@/api/entities";
import { apiRequest } from "@/api/http-client";
import { formatPlayedAtDate } from "@/lib/datetime";

import type { ApiCountryDetail, CountryDetail } from "./types";

export async function fetchCountries(): Promise<ApiCountry[]> {
  const res = await apiRequest<{ data: ApiCountry[] }>("/api/v1/countries");
  return res.data;
}

function initialsFromName(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function toCountryRef(country: ApiCountry): CountryDetail["country"] {
  return { code: country.code, name: country.name };
}

function normalizeCountryDetail(data: ApiCountryDetail): CountryDetail {
  const countryRef = toCountryRef(data.country);

  return {
    country: countryRef,
    stats: data.stats,
    leagues: data.leagues
      .map((league) => ({
        id: String(league.id),
        name: league.name,
        country: league.country ?? countryRef,
      }))
      .sort((a, b) => a.name.localeCompare(b.name)),
    teams: data.teams
      .map((team) => ({
        id: String(team.id),
        name: team.name,
        ...(team.logoUrl ? { logoUrl: team.logoUrl } : {}),
      }))
      .sort((a, b) => a.name.localeCompare(b.name)),
    featuredPlayers: data.featuredPlayers.map((entry) => ({
      player: {
        id: String(entry.player.id),
        name: entry.player.name,
        avatarInitials:
          entry.player.avatarInitials?.trim() ||
          initialsFromName(entry.player.name),
        position: entry.player.position ?? "—",
        ...(entry.player.teamId != null
          ? { teamId: String(entry.player.teamId) }
          : {}),
        ...(entry.player.countryCode
          ? { countryCode: entry.player.countryCode }
          : {}),
      },
      goals: entry.goals,
      assists: entry.assists,
      appearances: entry.appearances,
      yellowCards: entry.yellowCards,
      redCards: entry.redCards,
    })),
    recentMatches: data.recentMatches.map((match) => {
      const playedAt = match.playedAt ?? match.isoDate ?? "";
      return {
        id: String(match.id),
        homeTeam: {
          id: String(match.homeTeam.id),
          name: match.homeTeam.name,
        },
        awayTeam: {
          id: String(match.awayTeam.id),
          name: match.awayTeam.name,
        },
        league: {
          id: String(match.league.id),
          name: match.league.name,
          country: match.league.country ?? countryRef,
        },
        country: match.country ?? countryRef,
        scoreline: match.scoreline,
        status: match.status,
        kickoffLabel:
          match.kickoffLabel ??
          (playedAt ? formatPlayedAtDate(playedAt) : "—"),
        venue: match.venue ?? "Venue TBC",
        round: match.round ?? "—",
        live: match.live,
        isoDate: match.isoDate ?? playedAt.slice(0, 10),
      };
    }),
  };
}

export async function fetchCountryDetail(idOrCode: string): Promise<CountryDetail> {
  const encoded = encodeURIComponent(idOrCode.trim());
  const res = await apiRequest<{ data: ApiCountryDetail }>(
    `/api/v1/countries/${encoded}`,
  );
  return normalizeCountryDetail(res.data);
}
