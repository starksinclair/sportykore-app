export type TeamSide = "home" | "away";

export type CanterRole = "gk" | "def" | "mid" | "att";

export interface Vec2 {
  x: number;
  y: number;
}

export interface CanterPlayer {
  id: string;
  side: TeamSide;
  role: CanterRole;
  slot: number;
  label: string;
  x: number;
  y: number;
  isCaptain?: boolean;
}

export interface DemoTeam {
  side: TeamSide;
  name: string;
  shortName: string;
  primaryColor: string;
  secondaryColor: string;
  players: Omit<CanterPlayer, "side">[];
}

export type MatchHalf = 1 | 2;

export type MatchPhase =
  | "kickoff"
  | "in_progress"
  | "half_time"
  | "full_time";

export interface MatchStats {
  shots: number;
  passes: number;
  touches: number;
}

export type OwnerStage = "normal" | "annoyed" | "warning" | "vexed";

export interface OwnerState {
  stage: OwnerStage;
  hits: number;
  calmCounter: number;
}

export interface OwnerToast {
  id: number;
  message: string;
}

export interface MatchState {
  phase: MatchPhase;
  currentTurn: TeamSide;
  half: MatchHalf;
  clockRemainingMs: number;
  scoreHome: number;
  scoreAway: number;
  lastTouchCanterId: string | null;
  turnNo: number;
  statsHome: MatchStats;
  statsAway: MatchStats;
  ownerHome: OwnerState;
  ownerAway: OwnerState;
  toast: OwnerToast | null;
  voided: boolean;
}

export interface TurnResult {
  scored: TeamSide | null;
  lastTouchCanterId: string | null;
  /** Whether ANY canter touched the ball this turn — used for stats. */
  touchedBall: boolean;
  /** Whether the flicked canter itself touched the ball this turn — the
   * "owner of the ball" gate cares specifically about this, not just any
   * incidental contact elsewhere in the same settle. */
  flickerTouchedBall: boolean;
  touchedOpponentCaptain: boolean;
  retaliated: boolean;
}
