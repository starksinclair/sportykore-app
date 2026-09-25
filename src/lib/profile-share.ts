import { Share } from "react-native";

import type { ApiCoachProfile, ApiPlayer } from "@/api/entities";

const SPORTYKORE_DOWNLOAD_URL = "https://www.sportykore.com/download";

type PlayerShareStats = {
  goals: number;
  assists: number;
  cards: number;
};

type SharePlayerProfileOptions = {
  player: ApiPlayer;
  stats: PlayerShareStats;
  gamesPlayed: number;
  highlightsCount: number;
  awardsCount: number;
  positionLabel?: string | null;
  teamName?: string | null;
};

type ShareCoachProfileOptions = {
  coach: ApiCoachProfile;
};

export async function sharePlayerProfile({
  player,
  stats,
  gamesPlayed,
  highlightsCount,
  awardsCount,
  positionLabel,
  teamName,
}: SharePlayerProfileOptions) {
  const title = `${player.name} on SportyKore`;
  const proof = playerProofLine({
    player,
    stats,
    gamesPlayed,
    highlightsCount,
    awardsCount,
    positionLabel,
    teamName,
  });
  const context = [positionLabel, teamName].filter(Boolean).join(" for ");
  const lines = [
    title,
    proof,
    context ? `${context}.` : null,
    `Get SportyKore: ${SPORTYKORE_DOWNLOAD_URL}`,
  ].filter(Boolean);

  await Share.share({
    title,
    url: SPORTYKORE_DOWNLOAD_URL,
    message: lines.join("\n"),
  });
}

export async function shareCoachProfile({ coach }: ShareCoachProfileOptions) {
  const title = `${coach.displayName} on SportyKore`;
  const proof = coachProofLine(coach);
  const location = [coach.city, coach.state, coach.country?.name].filter(Boolean).join(", ");
  const lines = [
    title,
    proof,
    location ? `Based in ${location}.` : null,
    `Get SportyKore: ${SPORTYKORE_DOWNLOAD_URL}`,
  ].filter(Boolean);

  await Share.share({
    title,
    url: SPORTYKORE_DOWNLOAD_URL,
    message: lines.join("\n"),
  });
}

function playerProofLine({
  player,
  stats,
  gamesPlayed,
  highlightsCount,
  awardsCount,
  positionLabel,
  teamName,
}: SharePlayerProfileOptions): string {
  const statBits = [
    gamesPlayed > 0 ? pluralize(gamesPlayed, "game") : null,
    stats.goals > 0 ? pluralize(stats.goals, "goal") : null,
    stats.assists > 0 ? pluralize(stats.assists, "assist") : null,
    awardsCount > 0 ? pluralize(awardsCount, "player of the match award") : null,
  ].filter(Boolean);

  if (statBits.length > 0) {
    return statBits.join(", ");
  }

  if (highlightsCount > 0) {
    return `${pluralize(highlightsCount, "highlight clip")} on their player profile.`;
  }

  if (player.bio?.trim()) {
    return truncate(player.bio.trim(), 150);
  }

  if (positionLabel && teamName) {
    return `${positionLabel} building their football story with ${teamName}.`;
  }

  if (positionLabel) {
    return `${positionLabel} building a football profile with leagues, highlights, and stats.`;
  }

  return "Building a football profile with leagues, highlights, and match stats.";
}

function coachProofLine(coach: ApiCoachProfile): string {
  const leagues = coach.leagues ?? [];
  const activeLeagues = leagues.filter((league) => league.active);

  if (activeLeagues.length > 0) {
    return `${pluralize(activeLeagues.length, "current league role")} on their coach profile.`;
  }

  if (leagues.length > 0) {
    return `${pluralize(leagues.length, "league role")} in their coaching history.`;
  }

  if (coach.philosophy?.trim()) {
    return truncate(coach.philosophy.trim(), 150);
  }

  if (coach.bio?.trim()) {
    return truncate(coach.bio.trim(), 150);
  }

  if (coach.availability === "open") {
    return "Coach profile open to football opportunities.";
  }

  if (coach.availability === "consulting") {
    return "Coach profile available for consulting and football advisory work.";
  }

  return "Coach profile with experience, philosophy, and football links.";
}

function pluralize(count: number, label: string): string {
  return `${count} ${label}${count === 1 ? "" : "s"}`;
}

function truncate(value: string, maxLength: number): string {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 3).trim()}...`;
}
