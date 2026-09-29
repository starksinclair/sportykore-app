import { PITCH_HEIGHT, PITCH_WIDTH } from "../constants";
import type { DemoTeam } from "../types";

const CX = PITCH_WIDTH / 2;

export const DEMO_HOME_TEAM: DemoTeam = {
  side: "home",
  name: "Lagos Lions",
  shortName: "LAG",
  primaryColor: "#E6A817",
  secondaryColor: "#171717",
  players: [
    { id: "home-gk", role: "gk", slot: 0, label: "GK", x: CX, y: 530 },
    { id: "home-def-1", role: "def", slot: 1, label: "D1", x: CX - 70, y: 460 },
    { id: "home-def-2", role: "def", slot: 2, label: "D2", x: CX + 70, y: 460 },
    { id: "home-mid-1", role: "mid", slot: 3, label: "M1", x: CX - 70, y: 340, isCaptain: true },
    { id: "home-mid-2", role: "mid", slot: 4, label: "M2", x: CX + 70, y: 340 },
    { id: "home-att-1", role: "att", slot: 5, label: "A1", x: CX - 40, y: 240 },
    { id: "home-att-2", role: "att", slot: 6, label: "A2", x: CX + 40, y: 240 },
  ],
};

export const DEMO_AWAY_TEAM: DemoTeam = {
  side: "away",
  name: "Abuja Falcons",
  shortName: "ABJ",
  primaryColor: "#4A148C",
  secondaryColor: "#FFFFFF",
  players: [
    { id: "away-gk", role: "gk", slot: 0, label: "GK", x: CX, y: 30 },
    { id: "away-def-1", role: "def", slot: 1, label: "D1", x: CX - 70, y: 100 },
    { id: "away-def-2", role: "def", slot: 2, label: "D2", x: CX + 70, y: 100 },
    { id: "away-mid-1", role: "mid", slot: 3, label: "M1", x: CX - 70, y: 220, isCaptain: true },
    { id: "away-mid-2", role: "mid", slot: 4, label: "M2", x: CX + 70, y: 220 },
    { id: "away-att-1", role: "att", slot: 5, label: "A1", x: CX - 40, y: 320 },
    { id: "away-att-2", role: "att", slot: 6, label: "A2", x: CX + 40, y: 320 },
  ],
};

export const DEMO_BALL_START = { x: CX, y: PITCH_HEIGHT / 2 };

export const DEMO_TEAMS = {
  home: DEMO_HOME_TEAM,
  away: DEMO_AWAY_TEAM,
} as const;

export const CAPTAIN_IDS = {
  home: DEMO_HOME_TEAM.players.find((p) => p.isCaptain)!.id,
  away: DEMO_AWAY_TEAM.players.find((p) => p.isCaptain)!.id,
} as const;
