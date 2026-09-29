export const PITCH_WIDTH = 360;
export const PITCH_HEIGHT = 560;
export const PITCH_MARGIN = 18;

export const GOAL_WIDTH = 110;
export const GOAL_DEPTH = 14;

export const PENALTY_AREA_WIDTH = 220;
export const PENALTY_AREA_DEPTH = 90;

export const GK_AREA_WIDTH = 140;
export const GK_AREA_DEPTH = 44;

export const CENTER_CIRCLE_RADIUS = 60;

export const CANTER_RADIUS = 15;
export const BALL_RADIUS = 7;

export const CANTER_MASS = 8;
export const BALL_MASS = 1;

export const CANTER_FRICTION_AIR = 0.018;
export const BALL_FRICTION_AIR = 0.012;

export const WALL_RESTITUTION = 0.55;
export const BODY_RESTITUTION = 0.35;

export const MAX_DRAG_DISTANCE = 140;
export const MAX_LAUNCH_SPEED = 26;
export const MIN_LAUNCH_SPEED = 2;

export const REST_SPEED_THRESHOLD = 0.05;
export const REST_STABLE_FRAMES = 6;
export const MAX_SETTLE_MS = 6000;

export const PHYSICS_FIXED_TIMESTEP_MS = 1000 / 60;

export const MATCH_HALF_DURATION_MS = 2 * 60 * 1000 + 30 * 1000;
export const TURN_CLOCK_DECREMENT_MS = 4000;

export const PHYSICS_VERSION = 1;

export const PITCH_COLORS = {
  grassA: "#1E7A34",
  grassB: "#1B6E2F",
  lines: "rgba(255,255,255,0.85)",
  centerSpot: "rgba(255,255,255,0.85)",
  goalNet: "rgba(255,255,255,0.35)",
} as const;

export const TEAM_COLORS = {
  home: { primary: "#E6A817", secondary: "#171717" },
  away: { primary: "#4A148C", secondary: "#FFFFFF" },
} as const;

export const BALL_COLOR = "#F4F1E8";
export const GK_AREA_STROKE = "rgba(255,255,255,0.55)";

// "Owner of the ball" — casual-mode captain rage mechanic.
export const OWNER_ANNOYED_MIN = 1;
export const OWNER_WARNING_MIN = 4;
export const OWNER_VEXED_MIN = 7;
export const OWNER_COLLECT_EXTRA_HITS = 10;
export const OWNER_COLLECT_HITS = OWNER_VEXED_MIN + OWNER_COLLECT_EXTRA_HITS;
export const OWNER_CALM_TURNS = 4;
export const RETALIATION_IMPULSE_SPEED = 14;

export const OWNER_MESSAGES = {
  annoyed: "no vex the owner of the ball oo",
  warning: "no vex the owner oo, na him get the ball",
  vexed: "owner don vex",
  retaliation: "owner don warn you oo",
  collect: "owner don collect him ball",
} as const;
