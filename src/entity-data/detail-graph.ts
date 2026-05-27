import {
  PLAYERS as BASE_PLAYERS,
  COUNTRIES,
  LEAGUES,
  SEED_MATCHES,
  TEAMS,
  leagueById,
  teamById,
  type SeedMatch,
  type Player as SeedPlayer,
} from "@/home/mock/seed";
import type { ApiMatch, CountryRef, LeagueRef, TeamRef } from "@/home/types";
import { formatPlayedAtDate } from "@/lib/datetime";
import { addDays, startOfDay, toIsoDate } from "@/home/utils";

const POSITIONS = [
  "Forward",
  "Midfielder",
  "Winger",
  "Defender",
  "Goalkeeper",
] as const;
const FEET = ["Right", "Left"] as const;
const FIRST_NAMES = [
  "Ayo",
  "Sola",
  "Chima",
  "Kunle",
  "Musa",
  "Kwame",
  "Kojo",
  "Yaw",
  "Kossi",
  "Benoit",
  "Emeka",
  "Dayo",
] as const;
const LAST_NAMES = [
  "Johnson",
  "Mensah",
  "Okoro",
  "Adebayo",
  "Boateng",
  "Kouassi",
  "Bello",
  "Asante",
  "Okocha",
  "Sofo",
  "Diallo",
  "Ajayi",
] as const;
const REFEREES = [
  "Amina Yusuf",
  "Michael Tetteh",
  "Benoit Adjei",
  "Samuel Koffi",
  "David Eze",
] as const;

const TEAM_HOME_VENUES: Record<string, string> = {
  "tm-surulere": "Rowe Park",
  "tm-yaba": "UNILAG Sports Centre",
  "tm-festac": "National Stadium Annex",
  "tm-marina": "Campos Mini Stadium",
  "tm-agege": "Agege Township Arena",
  "tm-ikorodu": "Mobolaji Johnson Arena",
  "tm-ajegunle": "TBS Arena",
  "tm-lekki": "Legacy Pitch",
  "tm-sabon-gari": "Sani Abacha Training Ground",
  "tm-osu": "Accra Sports Annex",
  "tm-madina": "Madina Astro Turf",
  "tm-portonovo": "Stade René Pleven",
};

const LEAGUE_ROUND_META: Record<string, { prefix: string; todayBase: number }> =
  {
    "lg-gbako-premier": { prefix: "Matchday", todayBase: 13 },
    "lg-lagos-sunday": { prefix: "Round", todayBase: 9 },
    "lg-kano-shield": { prefix: "Week", todayBase: 6 },
    "lg-accra-city": { prefix: "Heat", todayBase: 4 },
    "lg-kumasi-cup": { prefix: "Round", todayBase: 5 },
    "lg-cotonou-cup": { prefix: "Group", todayBase: 2 },
    "lg-portonovo": { prefix: "Week", todayBase: 3 },
  };

export type PlayerRecord = SeedPlayer & {
  jerseyNumber: number;
  age: number;
  preferredFoot: (typeof FEET)[number];
  heightCm: number;
  nationalityCode: string;
  avatarInitials: string;
  synthetic?: boolean;
};

export type MatchGoalEvent = {
  teamId: string;
  playerId: string;
  minute: string;
  assistPlayerId?: string;
};

export type MatchCardEvent = {
  teamId: string;
  playerId: string;
  minute: string;
  card: "yellow" | "red";
};

export type DetailedMatch = ApiMatch & {
  dayOffset: number;
  league: LeagueRef;
  country: CountryRef;
  venue: string;
  round: string;
  attendance: number;
  referee: string;
  goals: MatchGoalEvent[];
  cards: MatchCardEvent[];
  notes: string[];
  stats: {
    possessionHome: number;
    possessionAway: number;
    shotsHome: number;
    shotsAway: number;
  };
};

export type MatchSummary = {
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

export type StandingRow = {
  team: TeamRef;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
};

export type PlayerAggregate = {
  player: PlayerRecord;
  goals: number;
  assists: number;
  appearances: number;
  yellowCards: number;
  redCards: number;
};

function hashString(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function padTime(hour: number, minute: number) {
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function scoreline(seed: SeedMatch) {
  if (seed.homeScore == null || seed.awayScore == null) {
    return padTime(seed.kickoffHour, seed.kickoffMinute);
  }
  return `${seed.homeScore} - ${seed.awayScore}`;
}

function teamLeagueMap() {
  const map = new Map<string, string>();
  for (const match of SEED_MATCHES) {
    if (!map.has(match.homeId)) map.set(match.homeId, match.leagueId);
    if (!map.has(match.awayId)) map.set(match.awayId, match.leagueId);
  }
  return map;
}

const TEAM_TO_LEAGUE = teamLeagueMap();

function teamCountryCode(teamId: string) {
  const leagueId = TEAM_TO_LEAGUE.get(teamId);
  return leagueId ? leagueById(leagueId).country.code : "NG";
}

function createGeneratedPlayer(team: TeamRef, index: number): PlayerRecord {
  const hash = hashString(`${team.id}-${index}`);
  const first = FIRST_NAMES[hash % FIRST_NAMES.length];
  const last = LAST_NAMES[(hash >> 3) % LAST_NAMES.length];
  const position = POSITIONS[index % POSITIONS.length];
  const nationalityCode = teamCountryCode(team.id);

  return {
    id: `pl-${team.id}-gen-${index + 1}`,
    name: `${first} ${last}`,
    teamId: team.id,
    position,
    jerseyNumber: 5 + index * 3,
    age: 19 + (hash % 12),
    preferredFoot: FEET[hash % FEET.length],
    heightCm: 168 + (hash % 18),
    nationalityCode,
    avatarInitials: initials(`${first} ${last}`),
    synthetic: true,
  };
}

function buildPlayers() {
  const byTeam = new Map<string, PlayerRecord[]>();

  for (const player of BASE_PLAYERS) {
    const hash = hashString(player.id);
    const record: PlayerRecord = {
      ...player,
      jerseyNumber: 7 + (hash % 19),
      age: 20 + (hash % 11),
      preferredFoot: FEET[hash % FEET.length],
      heightCm: 169 + (hash % 17),
      nationalityCode: teamCountryCode(player.teamId),
      avatarInitials: initials(player.name),
    };

    const current = byTeam.get(player.teamId) ?? [];
    current.push(record);
    byTeam.set(player.teamId, current);
  }

  for (const team of TEAMS) {
    const current = byTeam.get(team.id) ?? [];
    while (current.length < 4) {
      current.push(createGeneratedPlayer(team, current.length));
    }
    current.sort((a, b) => a.name.localeCompare(b.name));
    byTeam.set(team.id, current);
  }

  return Array.from(byTeam.values()).flat();
}

export const ALL_PLAYERS = buildPlayers();

const PLAYER_BY_ID = new Map(
  ALL_PLAYERS.map((player) => [player.id, player] as const),
);

function playersForTeam(teamId: string) {
  return ALL_PLAYERS.filter((player) => player.teamId === teamId);
}

function roundLabel(match: SeedMatch) {
  const meta = LEAGUE_ROUND_META[match.leagueId];
  if (!meta) return "Regular Season";

  if (meta.prefix === "Group") {
    const groupLetters = ["A", "B", "C"];
    return `${meta.prefix} ${groupLetters[(meta.todayBase + match.dayOffset) % groupLetters.length]}`;
  }

  return `${meta.prefix} ${meta.todayBase + match.dayOffset}`;
}

function attendanceFor(matchId: string) {
  return 180 + (hashString(matchId) % 420);
}

function refereeFor(matchId: string) {
  return REFEREES[hashString(matchId) % REFEREES.length];
}

function venueFor(homeTeamId: string) {
  return TEAM_HOME_VENUES[homeTeamId] ?? "Community Arena";
}

function played(seed: SeedMatch) {
  return seed.homeScore != null && seed.awayScore != null;
}

function buildGoals(seed: SeedMatch) {
  if (!played(seed)) return [] as MatchGoalEvent[];

  const homePlayers = playersForTeam(seed.homeId);
  const awayPlayers = playersForTeam(seed.awayId);
  const minutePool = [9, 18, 27, 41, 56, 68, 79, 87];
  const events: MatchGoalEvent[] = [];

  for (let index = 0; index < (seed.homeScore ?? 0); index += 1) {
    const scorer = homePlayers[index % Math.min(2, homePlayers.length)];
    const assist = homePlayers[(index + 1) % Math.min(3, homePlayers.length)];
    events.push({
      teamId: seed.homeId,
      playerId: scorer.id,
      minute: `${minutePool[index % minutePool.length]}'`,
      assistPlayerId:
        assist?.id && assist.id !== scorer.id ? assist.id : undefined,
    });
  }

  for (let index = 0; index < (seed.awayScore ?? 0); index += 1) {
    const scorer = awayPlayers[index % Math.min(2, awayPlayers.length)];
    const assist = awayPlayers[(index + 1) % Math.min(3, awayPlayers.length)];
    events.push({
      teamId: seed.awayId,
      playerId: scorer.id,
      minute: `${minutePool[(index + 3) % minutePool.length]}'`,
      assistPlayerId:
        assist?.id && assist.id !== scorer.id ? assist.id : undefined,
    });
  }

  return events.sort((a, b) => parseInt(a.minute, 10) - parseInt(b.minute, 10));
}

function buildCards(seed: SeedMatch) {
  if (!played(seed)) return [] as MatchCardEvent[];

  const homePlayers = playersForTeam(seed.homeId);
  const awayPlayers = playersForTeam(seed.awayId);
  const base = hashString(seed.id);
  const cards: MatchCardEvent[] = [];

  if (homePlayers.length > 0) {
    cards.push({
      teamId: seed.homeId,
      playerId: homePlayers[base % homePlayers.length].id,
      minute: `${54 + (base % 12)}'`,
      card: "yellow",
    });
  }

  if (awayPlayers.length > 0) {
    cards.push({
      teamId: seed.awayId,
      playerId: awayPlayers[(base + 1) % awayPlayers.length].id,
      minute: `${61 + (base % 9)}'`,
      card: "yellow",
    });
  }

  return cards;
}

function buildMatchNotes(seed: SeedMatch, league: LeagueRef) {
  if (seed.status === "scheduled") {
    return [
      `Kickoff at ${padTime(seed.kickoffHour, seed.kickoffMinute)} local time.`,
      `${league.name} ${roundLabel(seed)} fixture.`,
    ];
  }

  return [
    `${league.name} ${roundLabel(seed)} played at ${venueFor(seed.homeId)}.`,
    `${refereeFor(seed.id)} is the assigned referee.`,
  ];
}

function buildMatchStats(seed: SeedMatch) {
  const base = hashString(seed.id);
  const scoreSwing = (seed.homeScore ?? 0) - (seed.awayScore ?? 0);
  const possessionHome = Math.min(
    67,
    Math.max(33, 50 + scoreSwing * 6 + (base % 7) - 3),
  );
  const shotsHome = 6 + (base % 8) + (seed.homeScore ?? 0) * 2;
  const shotsAway = 5 + ((base >> 2) % 8) + (seed.awayScore ?? 0) * 2;

  return {
    possessionHome,
    possessionAway: 100 - possessionHome,
    shotsHome,
    shotsAway,
  };
}

export function allDetailedMatches(): DetailedMatch[] {
  const today = startOfDay(new Date());

  return SEED_MATCHES.map((seed) => {
    const date = addDays(today, seed.dayOffset);
    const isoDate = toIsoDate(date);
    const kickoffDisplay = padTime(seed.kickoffHour, seed.kickoffMinute);
    const league = leagueById(seed.leagueId);
    const home = teamById(seed.homeId);
    const away = teamById(seed.awayId);

    return {
      id: seed.id,
      dayOffset: seed.dayOffset,
      leagueId: league.id,
      countryCode: league.country.code,
      kickoffAt: `${isoDate}T${kickoffDisplay}:00`,
      kickoffDisplay,
      status: seed.status,
      minuteOrPhase: seed.minuteOrPhase,
      scoreline: scoreline(seed),
      live: seed.status === "live" || seed.status === "ht",
      home,
      away,
      league,
      country: league.country,
      venue: venueFor(seed.homeId),
      round: roundLabel(seed),
      attendance: attendanceFor(seed.id),
      referee: refereeFor(seed.id),
      goals: buildGoals(seed),
      cards: buildCards(seed),
      notes: buildMatchNotes(seed, league),
      stats: buildMatchStats(seed),
    };
  }).sort((a, b) => a.kickoffAt.localeCompare(b.kickoffAt));
}

export const DETAILED_MATCHES = allDetailedMatches();

export function matchById(id: string) {
  return DETAILED_MATCHES.find((match) => match.id === id) ?? null;
}

export function countryByCode(code: string) {
  return COUNTRIES.find((country) => country.code === code) ?? null;
}

export function leagueTeams(leagueId: string) {
  const ids = new Set<string>();
  for (const match of DETAILED_MATCHES) {
    if (match.leagueId !== leagueId) continue;
    ids.add(match.home.id);
    ids.add(match.away.id);
  }
  return TEAMS.filter((team) => ids.has(team.id)).sort((a, b) =>
    a.name.localeCompare(b.name),
  );
}

export function leagueMatches(leagueId: string) {
  return DETAILED_MATCHES.filter((match) => match.leagueId === leagueId);
}

export function countryMatches(countryCode: string) {
  return DETAILED_MATCHES.filter((match) => match.countryCode === countryCode);
}

export function teamMatches(teamId: string) {
  return DETAILED_MATCHES.filter(
    (match) => match.home.id === teamId || match.away.id === teamId,
  );
}

export function playerById(id: string) {
  return PLAYER_BY_ID.get(id) ?? null;
}

export function teamPlayers(teamId: string) {
  return playersForTeam(teamId);
}

export function leaguePlayers(leagueId: string) {
  const teamIds = new Set(leagueTeams(leagueId).map((team) => team.id));
  return ALL_PLAYERS.filter((player) => teamIds.has(player.teamId));
}

export function countryPlayers(countryCode: string) {
  const leagueIds = new Set(
    LEAGUES.filter((league) => league.country.code === countryCode).map(
      (league) => league.id,
    ),
  );
  return ALL_PLAYERS.filter((player) =>
    leagueIds.has(TEAM_TO_LEAGUE.get(player.teamId) ?? ""),
  );
}

function matchHasBegun(match: DetailedMatch) {
  return (
    match.status !== "scheduled" &&
    match.status !== "postponed" &&
    match.status !== "canceled"
  );
}

function scorePair(match: DetailedMatch) {
  const m = match.scoreline.match(/^(\d+)\s*-\s*(\d+)$/);
  return m ? { home: Number(m[1]), away: Number(m[2]) } : null;
}

export function standingsForLeague(leagueId: string): StandingRow[] {
  const rows = new Map<string, StandingRow>();

  for (const team of leagueTeams(leagueId)) {
    rows.set(team.id, {
      team,
      played: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
      points: 0,
    });
  }

  for (const match of leagueMatches(leagueId)) {
    if (!matchHasBegun(match)) continue;
    const score = scorePair(match);
    if (!score) continue;

    const home = rows.get(match.home.id);
    const away = rows.get(match.away.id);
    if (!home || !away) continue;

    home.played += 1;
    away.played += 1;
    home.goalsFor += score.home;
    home.goalsAgainst += score.away;
    away.goalsFor += score.away;
    away.goalsAgainst += score.home;

    if (score.home > score.away) {
      home.wins += 1;
      home.points += 3;
      away.losses += 1;
    } else if (score.home < score.away) {
      away.wins += 1;
      away.points += 3;
      home.losses += 1;
    } else {
      home.draws += 1;
      away.draws += 1;
      home.points += 1;
      away.points += 1;
    }
  }

  const output = Array.from(rows.values()).map((row) => ({
    ...row,
    goalDifference: row.goalsFor - row.goalsAgainst,
  }));

  output.sort(
    (a, b) =>
      b.points - a.points ||
      b.goalDifference - a.goalDifference ||
      b.goalsFor - a.goalsFor ||
      a.team.name.localeCompare(b.team.name),
  );

  return output;
}

export function playerAggregate(playerId: string): PlayerAggregate | null {
  const player = playerById(playerId);
  if (!player) return null;

  const appearances = teamMatches(player.teamId).filter(matchHasBegun).length;
  let goals = 0;
  let assists = 0;
  let yellowCards = 0;
  let redCards = 0;

  for (const match of DETAILED_MATCHES) {
    for (const goal of match.goals) {
      if (goal.playerId === playerId) goals += 1;
      if (goal.assistPlayerId === playerId) assists += 1;
    }
    for (const card of match.cards) {
      if (card.playerId !== playerId) continue;
      if (card.card === "yellow") yellowCards += 1;
      if (card.card === "red") redCards += 1;
    }
  }

  return {
    player,
    goals,
    assists,
    appearances,
    yellowCards,
    redCards,
  };
}

export function playerRecentMatches(playerId: string) {
  const player = playerById(playerId);
  if (!player) return [];

  return teamMatches(player.teamId)
    .filter(matchHasBegun)
    .map((match) => {
      const goals = match.goals.filter(
        (goal) => goal.playerId === playerId,
      ).length;
      const assists = match.goals.filter(
        (goal) => goal.assistPlayerId === playerId,
      ).length;
      const opponent =
        match.home.id === player.teamId ? match.away : match.home;
      return {
        match,
        opponent,
        goals,
        assists,
      };
    })
    .sort((a, b) => b.match.kickoffAt.localeCompare(a.match.kickoffAt));
}

export function topScorersForLeague(leagueId: string, limit = 5) {
  return leaguePlayers(leagueId)
    .map((player) => playerAggregate(player.id))
    .filter((entry): entry is PlayerAggregate => Boolean(entry))
    .sort(
      (a, b) =>
        b.goals - a.goals ||
        b.assists - a.assists ||
        a.player.name.localeCompare(b.player.name),
    )
    .slice(0, limit);
}

export function summariesForMatches(matches: DetailedMatch[]): MatchSummary[] {
  return matches
    .map((match) => ({
      id: match.id,
      homeTeam: match.home,
      awayTeam: match.away,
      league: match.league,
      country: match.country,
      scoreline: match.scoreline,
      status: match.minuteOrPhase,
      kickoffLabel: formatPlayedAtDate(match.kickoffAt),
      venue: match.venue,
      round: match.round,
      live: match.live,
      isoDate: match.kickoffAt.slice(0, 10),
    }))
    .sort((a, b) => b.isoDate.localeCompare(a.isoDate));
}
