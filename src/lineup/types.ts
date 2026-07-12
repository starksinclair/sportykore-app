import type { ApiPlayer, ApiTeam, PlayerPosition } from "@/api/entities";

export type FormationSlot = {
  key: string;
  position: string;
  line: number;
  order: number;
  label: string;
};

export type Formation = {
  id: number;
  name: string;
  displayName: string;
  isActive: boolean;
  slots: FormationSlot[];
};

export type GameLineup = {
  id: number;
  gameId: number;
  teamId: number;
  playerId: number;
  formationId: number;
  slotKey: string | null;
  status: "starter" | "substitute" | "did_not_play";
  position: string | null;
  jerseyNumber: number | null;
  startingOrder: number | null;
  subbedInMinute: number | null;
  subbedOutMinute: number | null;
  player: ApiPlayer;
  team: ApiTeam;
  formation?: Formation;
};

export type LineupTeamAdminUser = {
  id: number;
  email: string;
  fullName: string | null;
};

export type LineupTeamAdmin = {
  id: number;
  teamId: number;
  userId: number;
  leagueId: number;
  user: LineupTeamAdminUser;
};

export type LineupTeam = ApiTeam & {
  admins?: LineupTeamAdmin[];
};

export type TeamLineupGroup = {
  team: LineupTeam;
  formation: Formation | null;
  starters: GameLineup[];
  substitutes: GameLineup[];
};

export type SetLineupStarter = {
  playerId: number;
  slotKey: string;
  jerseyNumber?: number;
};

export type SetLineupSubstitute = {
  playerId: number;
  jerseyNumber?: number;
};

export type SetLineupPayload = {
  teamId: number;
  formationId: number;
  starters: SetLineupStarter[];
  substitutes: SetLineupSubstitute[];
};

export type SlotAssignment = {
  playerId: number;
  playerName: string;
  jerseyNumber: number | null;
};

export type SubAssignment = {
  playerId: number;
  playerName: string;
  jerseyNumber: number | null;
};

export type RosterPickerPlayer = {
  playerId: number;
  playerName: string;
  jerseyNumber: number | null;
  position: PlayerPosition | null;
};
