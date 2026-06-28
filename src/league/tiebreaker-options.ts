export type TiebreakerRule =
  | "goal_difference_goals_scored"
  | "goals_scored_goal_difference"
  | "wins_goal_difference_goals_scored"
  | "goal_difference_goals_conceded"
  | "goal_difference_goals_scored_away_goals"
  | "goal_difference_goals_scored_head_to_head"
  | "head_to_head_goal_difference_goals_scored"
  | "head_to_head_goals_scored_goal_difference"
  | "away_goals_scored_goal_difference_goals_scored";

export type TiebreakerOption = {
  id: TiebreakerRule;
  label: string;
  description: string;
};

export const DEFAULT_TIEBREAKER: TiebreakerRule = "goal_difference_goals_scored";

export const TIEBREAKER_OPTIONS: readonly TiebreakerOption[] = [
  {
    id: "goal_difference_goals_scored",
    label: "Goal difference, then goals scored",
    description: "Standard table order when teams are level on points.",
  },
  {
    id: "goals_scored_goal_difference",
    label: "Goals scored, then goal difference",
    description: "Rewards attacking output before goal difference.",
  },
  {
    id: "wins_goal_difference_goals_scored",
    label: "Wins, then GD, then goals scored",
    description: "Most wins first, then goal difference and goals scored.",
  },
  {
    id: "goal_difference_goals_conceded",
    label: "Goal difference, then goals conceded",
    description: "Fewer goals conceded breaks ties after goal difference.",
  },
  {
    id: "goal_difference_goals_scored_away_goals",
    label: "GD, then goals scored, then away goals",
    description: "Away goals count after goal difference and goals scored.",
  },
  {
    id: "goal_difference_goals_scored_head_to_head",
    label: "GD, then goals scored, then head-to-head",
    description: "Direct meetings decide before other tiebreakers.",
  },
  {
    id: "head_to_head_goal_difference_goals_scored",
    label: "Head-to-head, then GD, then goals scored",
    description: "Mini-league among tied teams comes first.",
  },
  {
    id: "head_to_head_goals_scored_goal_difference",
    label: "Head-to-head, then goals scored, then GD",
    description: "Head-to-head points, then goals scored, then GD.",
  },
  {
    id: "away_goals_scored_goal_difference_goals_scored",
    label: "Away goals, then GD, then goals scored",
    description: "Away goals scored breaks ties early in the order.",
  },
] as const;

export function tiebreakerLabel(id: TiebreakerRule): string {
  return TIEBREAKER_OPTIONS.find((option) => option.id === id)?.label ?? id;
}
