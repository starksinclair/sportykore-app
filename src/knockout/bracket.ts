import type {
  ApiTeam,
  ApiTie,
  BracketRound,
  KnockoutStageConfig,
  KnockoutTieConfig,
} from "@/api/entities";

import { BRACKET_ROUND_ORDER, nextPow2 } from "./utils";

/** Team count that enters each round. Round name is authoritative for size. */
export const ROUND_SIZE: Record<Exclude<BracketRound, "third_place">, number> = {
  r256: 256,
  r128: 128,
  r64: 64,
  r32: 32,
  r16: 16,
  qf: 8,
  sf: 4,
  final: 2,
};

function sizeOf(round: BracketRound): number {
  return round === "third_place"
    ? 0
    : ROUND_SIZE[round as Exclude<BracketRound, "third_place">];
}

export function roundFromSize(size: number): BracketRound {
  for (const round of BRACKET_ROUND_ORDER) {
    if (sizeOf(round) === size) return round;
  }
  return size > 256 ? "r256" : "final";
}

export function entryRoundForTeamCount(n: number): BracketRound {
  return roundFromSize(nextPow2(Math.max(2, n)));
}

export type BracketSlot = {
  /** Stable key even for placeholders: `${round}:${position}`. */
  key: string;
  round: BracketRound;
  position: number;
  /** null = TBD placeholder (round not generated yet). */
  tie: ApiTie | null;
};

export type BracketColumn = {
  round: BracketRound;
  slots: BracketSlot[];
};

export type BracketScaffold = {
  entryRound: BracketRound;
  bracketSize: number;
  /** Entry-round ties per side; drives the bracket's vertical rhythm. */
  perSideEntryCount: number;
  /** Pre-final rounds, entry→sf order (rendered left to right). */
  leftColumns: BracketColumn[];
  /** Pre-final rounds, sf→entry order so both arrays render left to right. */
  rightColumns: BracketColumn[];
  final: BracketSlot;
  thirdPlace: BracketSlot | null;
  champion: ApiTeam | null;
};

/**
 * Expand real ties into the full grid of slots up to the final, with
 * placeholders for rounds that haven't been generated yet.
 */
export function buildBracketScaffold(
  ties: ApiTie[],
  opts?: { hasThirdPlace?: boolean },
): BracketScaffold | null {
  const entryIndex = BRACKET_ROUND_ORDER.findIndex((round) =>
    ties.some((t) => t.round === round),
  );
  if (entryIndex < 0) return null;

  const entryRound = BRACKET_ROUND_ORDER[entryIndex]!;
  const bracketSize = sizeOf(entryRound);

  const byKey = new Map<string, ApiTie>();
  for (const tie of ties) {
    byKey.set(`${tie.round}:${tie.bracketPosition}`, tie);
  }

  const preFinal: BracketColumn[] = [];
  let final: BracketSlot | null = null;
  for (let i = entryIndex; i < BRACKET_ROUND_ORDER.length; i += 1) {
    const round = BRACKET_ROUND_ORDER[i]!;
    const count = sizeOf(round) / 2;
    const slots: BracketSlot[] = [];
    for (let position = 1; position <= count; position += 1) {
      const key = `${round}:${position}`;
      slots.push({ key, round, position, tie: byKey.get(key) ?? null });
    }
    if (round === "final") {
      final = slots[0]!;
    } else {
      preFinal.push({ round, slots });
    }
  }
  if (!final) return null;

  const leftColumns: BracketColumn[] = [];
  const rightColumns: BracketColumn[] = [];
  for (const column of preFinal) {
    const mid = Math.ceil(column.slots.length / 2);
    leftColumns.push({ round: column.round, slots: column.slots.slice(0, mid) });
    rightColumns.unshift({ round: column.round, slots: column.slots.slice(mid) });
  }

  const realThirdPlace = ties.find((t) => t.round === "third_place") ?? null;
  const thirdPlace: BracketSlot | null = realThirdPlace
    ? { key: "third_place:1", round: "third_place", position: 1, tie: realThirdPlace }
    : opts?.hasThirdPlace && bracketSize >= 4
      ? { key: "third_place:1", round: "third_place", position: 1, tie: null }
      : null;

  const champion =
    final.tie?.status === "completed" ? (final.tie.winnerTeam ?? null) : null;

  return {
    entryRound,
    bracketSize,
    perSideEntryCount: Math.max(1, bracketSize / 4),
    leftColumns,
    rightColumns,
    final,
    thirdPlace,
    champion,
  };
}

function entryTieConfig(
  config: KnockoutStageConfig | Record<string, unknown> | null | undefined,
  round: BracketRound,
): KnockoutTieConfig {
  const cfg = config as KnockoutStageConfig | null | undefined;
  return cfg?.ties?.rounds?.[round] ?? cfg?.ties?.default ?? { tie_format: "single" };
}

/**
 * Predict the entry-round ties the server will create for a seed order,
 * mirroring the documented algorithm: the top `nextPow2(N) - N` seeds get
 * bye ties first (positions 1..byes), then the remaining seeds pair
 * sequentially in order. Synthetic negative ids mark these as previews.
 */
export function buildSeedPreviewTies(
  teams: ApiTeam[],
  config?: KnockoutStageConfig | Record<string, unknown> | null,
): ApiTie[] {
  const n = teams.length;
  if (n < 2) return [];

  const bracketSize = nextPow2(n);
  const byes = bracketSize - n;
  const entryRound = roundFromSize(bracketSize);
  const tieConfig = entryTieConfig(config, entryRound);
  const tieFormat = tieConfig.tie_format ?? "single";
  const bestOf = tieFormat === "best_of" ? (tieConfig.best_of ?? 3) : null;

  const base = {
    stageId: -1,
    round: entryRound,
    tieFormat,
    bestOf,
    targetWins: bestOf != null ? Math.floor(bestOf / 2) + 1 : null,
    awayGoals: tieFormat === "two_legged" ? Boolean(tieConfig.away_goals) : false,
    homeScoreAgg: null,
    awayScoreAgg: null,
  };

  const ties: ApiTie[] = [];
  for (let position = 1; position <= byes; position += 1) {
    const team = teams[position - 1]!;
    ties.push({
      ...base,
      id: -position,
      bracketPosition: position,
      isBye: true,
      status: "completed",
      homeTeam: team,
      awayTeam: null,
      winnerTeam: team,
      games: [],
    });
  }
  let position = byes + 1;
  for (let i = byes; i < n; i += 2, position += 1) {
    ties.push({
      ...base,
      id: -position,
      bracketPosition: position,
      isBye: false,
      status: "pending",
      homeTeam: teams[i]!,
      awayTeam: teams[i + 1]!,
      winnerTeam: null,
      games: [],
    });
  }
  return ties;
}

/** User-facing reason for byes, or null when the bracket is full. */
export function byeExplanation(teamCount: number): string | null {
  if (teamCount < 2) return null;
  const bracketSize = nextPow2(teamCount);
  const byes = bracketSize - teamCount;
  if (byes === 0) return null;
  const who = byes === 1 ? "the top seed skips" : `the top ${byes} seeds skip`;
  return `You have ${teamCount} teams; the bracket needs ${bracketSize}, so ${who} round one.`;
}
