import type { CountryRef, LeagueRef, MatchStatus, TeamRef } from "../types";

export type SeedMatch = {
  id: string;
  dayOffset: number;
  leagueId: string;
  homeId: string;
  awayId: string;
  kickoffHour: number;
  kickoffMinute: number;
  status: MatchStatus;
  minuteOrPhase: string;
  homeScore?: number;
  awayScore?: number;
};

export const COUNTRIES: CountryRef[] = [
  { code: "NG", name: "Nigeria" },
  { code: "GH", name: "Ghana" },
  { code: "BJ", name: "Benin" },
];

const country = (code: string) => {
  const found = COUNTRIES.find((c) => c.code === code);
  if (!found) {
    throw new Error(`Unknown country code: ${code}`);
  }
  return found;
};

export const LEAGUES: LeagueRef[] = [
  { id: "lg-gbako-premier", name: "Gbako Premier", country: country("NG") },
  {
    id: "lg-lagos-sunday",
    name: "Lagos Sunday League",
    country: country("NG"),
  },
  {
    id: "lg-kano-shield",
    name: "Kano Community Shield",
    country: country("NG"),
  },
  { id: "lg-accra-city", name: "Accra City Series", country: country("GH") },
  { id: "lg-kumasi-cup", name: "Kumasi District Cup", country: country("GH") },
  { id: "lg-cotonou-cup", name: "Cotonou Coastal Cup", country: country("BJ") },
  { id: "lg-portonovo", name: "Porto-Novo Series", country: country("BJ") },
];

export const TEAMS: TeamRef[] = [
  { id: "tm-surulere", name: "Surulere United" },
  { id: "tm-yaba", name: "Yaba Tigers" },
  { id: "tm-festac", name: "Festac Ballers" },
  { id: "tm-marina", name: "Marina FC" },
  { id: "tm-agege", name: "Agege Warriors" },
  { id: "tm-ikorodu", name: "Ikorodu City B" },
  { id: "tm-ajegunle", name: "Ajegunle Stars" },
  { id: "tm-lekki", name: "Lekki Mariners" },
  { id: "tm-ojota", name: "Ojota Rovers" },
  { id: "tm-mushin", name: "Mushin Royals" },
  { id: "tm-sabon-gari", name: "Sabon Gari Strikers" },
  { id: "tm-dala", name: "Dala United" },
  { id: "tm-osu", name: "Osu Harbour" },
  { id: "tm-tema", name: "Tema Athletic" },
  { id: "tm-madina", name: "Madina Red" },
  { id: "tm-kaneshie", name: "Kaneshie Eleven" },
  { id: "tm-portonovo", name: "Porto-Novo Waves" },
  { id: "tm-cotonou", name: "Cotonou Blaze" },
];

export type Player = {
  id: string;
  name: string;
  teamId: string;
  position: string;
};

export const PLAYERS: Player[] = [
  {
    id: "pl-1",
    name: "Tunde Adebayo",
    teamId: "tm-surulere",
    position: "Forward",
  },
  {
    id: "pl-2",
    name: "Kelechi Okoye",
    teamId: "tm-yaba",
    position: "Midfielder",
  },
  {
    id: "pl-3",
    name: "Femi Olawale",
    teamId: "tm-marina",
    position: "Defender",
  },
  {
    id: "pl-4",
    name: "Ibrahim Bello",
    teamId: "tm-sabon-gari",
    position: "Goalkeeper",
  },
  { id: "pl-5", name: "Kwame Asante", teamId: "tm-osu", position: "Forward" },
  { id: "pl-6", name: "Kojo Mensah", teamId: "tm-tema", position: "Winger" },
  {
    id: "pl-7",
    name: "Yaw Boateng",
    teamId: "tm-madina",
    position: "Midfielder",
  },
  {
    id: "pl-8",
    name: "Adelani Sofo",
    teamId: "tm-portonovo",
    position: "Forward",
  },
  {
    id: "pl-9",
    name: "Chinedu Eze",
    teamId: "tm-ajegunle",
    position: "Midfielder",
  },
  {
    id: "pl-10",
    name: "Daniel Okocha",
    teamId: "tm-festac",
    position: "Forward",
  },
];

/**
 * Fixtures are stored relative to "today" via `dayOffset` so the mock keeps
 * working regardless of when the app is launched.
 */
export const SEED_MATCHES: SeedMatch[] = [
  // Yesterday
  {
    id: "m-gpy-1",
    dayOffset: -1,
    leagueId: "lg-gbako-premier",
    homeId: "tm-surulere",
    awayId: "tm-yaba",
    kickoffHour: 16,
    kickoffMinute: 0,
    status: "ft",
    minuteOrPhase: "FT",
    homeScore: 1,
    awayScore: 1,
  },
  {
    id: "m-gpy-2",
    dayOffset: -1,
    leagueId: "lg-gbako-premier",
    homeId: "tm-festac",
    awayId: "tm-marina",
    kickoffHour: 18,
    kickoffMinute: 30,
    status: "ft",
    minuteOrPhase: "FT",
    homeScore: 2,
    awayScore: 0,
  },
  {
    id: "m-lsly-1",
    dayOffset: -1,
    leagueId: "lg-lagos-sunday",
    homeId: "tm-ajegunle",
    awayId: "tm-lekki",
    kickoffHour: 19,
    kickoffMinute: 30,
    status: "ft",
    minuteOrPhase: "FT",
    homeScore: 0,
    awayScore: 3,
  },

  // Today
  {
    id: "m-gpt-1",
    dayOffset: 0,
    leagueId: "lg-gbako-premier",
    homeId: "tm-surulere",
    awayId: "tm-agege",
    kickoffHour: 16,
    kickoffMinute: 30,
    status: "live",
    minuteOrPhase: "72'",
    homeScore: 2,
    awayScore: 1,
  },
  {
    id: "m-gpt-2",
    dayOffset: 0,
    leagueId: "lg-gbako-premier",
    homeId: "tm-yaba",
    awayId: "tm-festac",
    kickoffHour: 18,
    kickoffMinute: 0,
    status: "scheduled",
    minuteOrPhase: "Kickoff",
  },
  {
    id: "m-gpt-3",
    dayOffset: 0,
    leagueId: "lg-gbako-premier",
    homeId: "tm-marina",
    awayId: "tm-ikorodu",
    kickoffHour: 20,
    kickoffMinute: 15,
    status: "scheduled",
    minuteOrPhase: "Kickoff",
  },
  {
    id: "m-lslt-1",
    dayOffset: 0,
    leagueId: "lg-lagos-sunday",
    homeId: "tm-ajegunle",
    awayId: "tm-ojota",
    kickoffHour: 17,
    kickoffMinute: 0,
    status: "live",
    minuteOrPhase: "54'",
    homeScore: 1,
    awayScore: 0,
  },
  {
    id: "m-lslt-2",
    dayOffset: 0,
    leagueId: "lg-lagos-sunday",
    homeId: "tm-lekki",
    awayId: "tm-mushin",
    kickoffHour: 19,
    kickoffMinute: 10,
    status: "scheduled",
    minuteOrPhase: "Kickoff",
  },
  {
    id: "m-kcst-1",
    dayOffset: 0,
    leagueId: "lg-kano-shield",
    homeId: "tm-sabon-gari",
    awayId: "tm-dala",
    kickoffHour: 17,
    kickoffMinute: 0,
    status: "scheduled",
    minuteOrPhase: "Kickoff",
  },
  {
    id: "m-acst-1",
    dayOffset: 0,
    leagueId: "lg-accra-city",
    homeId: "tm-osu",
    awayId: "tm-tema",
    kickoffHour: 16,
    kickoffMinute: 0,
    status: "live",
    minuteOrPhase: "31'",
    homeScore: 0,
    awayScore: 0,
  },
  {
    id: "m-acst-2",
    dayOffset: 0,
    leagueId: "lg-accra-city",
    homeId: "tm-madina",
    awayId: "tm-kaneshie",
    kickoffHour: 18,
    kickoffMinute: 40,
    status: "scheduled",
    minuteOrPhase: "Kickoff",
  },
  {
    id: "m-ccct-1",
    dayOffset: 0,
    leagueId: "lg-cotonou-cup",
    homeId: "tm-portonovo",
    awayId: "tm-cotonou",
    kickoffHour: 16,
    kickoffMinute: 30,
    status: "scheduled",
    minuteOrPhase: "Kickoff",
  },

  // Tomorrow
  {
    id: "m-gpr-1",
    dayOffset: 1,
    leagueId: "lg-gbako-premier",
    homeId: "tm-agege",
    awayId: "tm-marina",
    kickoffHour: 15,
    kickoffMinute: 30,
    status: "scheduled",
    minuteOrPhase: "Kickoff",
  },
  {
    id: "m-gpr-2",
    dayOffset: 1,
    leagueId: "lg-gbako-premier",
    homeId: "tm-ikorodu",
    awayId: "tm-surulere",
    kickoffHour: 18,
    kickoffMinute: 20,
    status: "scheduled",
    minuteOrPhase: "Kickoff",
  },
  {
    id: "m-acsr-1",
    dayOffset: 1,
    leagueId: "lg-accra-city",
    homeId: "tm-tema",
    awayId: "tm-madina",
    kickoffHour: 17,
    kickoffMinute: 45,
    status: "scheduled",
    minuteOrPhase: "Kickoff",
  },
];

export const teamById = (id: string): TeamRef => {
  const team = TEAMS.find((t) => t.id === id);
  if (!team) {
    throw new Error(`Unknown team id: ${id}`);
  }
  return team;
};

export const leagueById = (id: string): LeagueRef => {
  const league = LEAGUES.find((l) => l.id === id);
  if (!league) {
    throw new Error(`Unknown league id: ${id}`);
  }
  return league;
};
