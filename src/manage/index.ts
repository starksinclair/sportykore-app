export {
  assignTeamAdmin,
  createGame,
  createSeason,
  createStat,
  createTeam,
  deleteGame,
  deleteStat,
  deleteTeam,
  endGameFullTime,
  fetchLeagueTeams,
  fetchManagedHub,
  fetchOwnedLeagues,
  fetchSeasonRoster,
  pauseGame,
  recordSubstitutions,
  resumeGame,
  accreditStat,
  updateGameScore,
  startExtraTime,
  startFirstHalf,
  startHalfTime,
  startSecondHalf,
  updateGame,
  updateLeague,
  updateLeaguePlayer,
  updateSeason,
  updateTeam,
  removeLeaguePlayer,
  removeTeamAdmin,
} from "./api";
export type { CreateTeamPayload, UpdateTeamPayload } from "./api";
export { promptBiometricGate } from "./biometric-gate";
export {
  ManageGamesTab,
  ManageLeagueRow,
  ManageAdminTeamRow,
  ManageLoginPrompt,
  ManagePlayersTab,
  ManageSettingsTab,
  ManageTeamsTab,
  TeamFormSheet,
  GameControls,
  LiveMinute,
} from "./components";
export {
  useAssignTeamAdmin,
  useCreateGame,
  useCreateSeason,
  useCreateTeam,
  useAccreditStat,
  useCreateStat,
  useDeleteGame,
  useDeleteStat,
  useDeleteTeam,
  useGameTimeActions,
  useUpdateGameScore,
  useLeagueTeams,
  useManageLeagueDetail,
  useManagedHub,
  useOwnedLeagues,
  useSeasonRoster,
  useRecordSubstitutions,
  useRemoveLeaguePlayer,
  useRemoveTeamAdmin,
  useUpdateLeaguePlayer,
  useUpdateGame,
  useUpdateLeague,
  useUpdateSeason,
  useUpdateTeam,
} from "./hooks";
export { useLiveMinute } from "@/hooks/useLiveMinute";
export { useGamePhaseLabel } from "@/hooks/useGamePhaseLabel";
export { useTransmitGameListener } from "@/lib/transmit";
export type { GameSSEPayload } from "@/lib/transmit";
export { manageKeys } from "./queryKeys";
export type {
  CreateGamePayload,
  CreateSeasonPayload,
  CreateStatPayload,
  CreatedSeason,
  LeagueRosterRow,
  ManagedHub,
  ManagedTeam,
  AdminTeamManaged,
  OwnedLeague,
  RecordSubstitutionItem,
  RecordSubstitutionsPayload,
  RecordSubstitutionsResult,
  TeamAdmin,
  TeamAdminUser,
  UpdateGamePayload,
  UpdateLeaguePayload,
  UpdateSeasonPayload,
} from "./types";
export {
  GameStatus,
  MatchEventStatName,
  RosterPosition,
  SeasonStatusEnum,
} from "./types";
export {
  applyScoreDelta,
  partitionGames,
  resolveStatTypeId,
  scoresAffectingStat,
} from "./utils/games";
export {
  findLatestUnaccreditedGoal,
  isGoalStat,
  isSubstitutionOffStat,
  isSubstitutionOnStat,
  isUnaccreditedGoal,
  pairSubstitutionEvents,
  partitionGoalStats,
} from "./utils/stats";
export type { PairedSubstitution } from "./utils/stats";
export {
  calculateCurrentMinute,
  formatLiveMinuteLabel,
  isGameClockTicking,
  isGameLivePeriod,
} from "@/lib/game-time";
export type { GameClockFields } from "@/lib/game-time";
