import type { ApiTeam, ApiTie } from "@/api/entities";

import {
  buildBracketScaffold,
  buildSeedPreviewTies,
  byeExplanation,
  entryRoundForTeamCount,
  roundFromSize,
} from "../bracket";

function team(id: number): ApiTeam {
  return { id, name: `Team ${id}`, logoUrl: null };
}

function teams(count: number): ApiTeam[] {
  return Array.from({ length: count }, (_, i) => team(i + 1));
}

let nextTieId = 1000;
function makeTie(
  overrides: Partial<ApiTie> & Pick<ApiTie, "round" | "bracketPosition">,
): ApiTie {
  nextTieId += 1;
  return {
    id: nextTieId,
    stageId: 1,
    tieFormat: "single",
    bestOf: null,
    targetWins: null,
    awayGoals: false,
    isBye: false,
    homeScoreAgg: null,
    awayScoreAgg: null,
    status: "pending",
    homeTeam: null,
    awayTeam: null,
    winnerTeam: null,
    games: [],
    ...overrides,
  };
}

describe("roundFromSize / entryRoundForTeamCount", () => {
  it("maps sizes to rounds", () => {
    expect(roundFromSize(2)).toBe("final");
    expect(roundFromSize(4)).toBe("sf");
    expect(roundFromSize(8)).toBe("qf");
    expect(roundFromSize(16)).toBe("r16");
    expect(roundFromSize(32)).toBe("r32");
    expect(roundFromSize(256)).toBe("r256");
  });

  it("maps team counts through nextPow2", () => {
    expect(entryRoundForTeamCount(2)).toBe("final");
    expect(entryRoundForTeamCount(3)).toBe("sf");
    expect(entryRoundForTeamCount(6)).toBe("qf");
    expect(entryRoundForTeamCount(20)).toBe("r32");
    expect(entryRoundForTeamCount(129)).toBe("r256");
  });
});

describe("buildSeedPreviewTies", () => {
  it("returns [] for fewer than two teams", () => {
    expect(buildSeedPreviewTies([])).toEqual([]);
    expect(buildSeedPreviewTies(teams(1))).toEqual([]);
  });

  it("pairs a full bracket sequentially with no byes (N=8)", () => {
    const ties = buildSeedPreviewTies(teams(8));
    expect(ties).toHaveLength(4);
    expect(ties.every((t) => t.round === "qf" && !t.isBye)).toBe(true);
    expect(ties.map((t) => t.bracketPosition)).toEqual([1, 2, 3, 4]);
    expect(
      ties.map((t) => [t.homeTeam?.id, t.awayTeam?.id]),
    ).toEqual([[1, 2], [3, 4], [5, 6], [7, 8]]);
    expect(ties.every((t) => t.status === "pending" && t.winnerTeam == null)).toBe(
      true,
    );
  });

  it("gives the top seeds byes first, then pairs the rest (N=6)", () => {
    const ties = buildSeedPreviewTies(teams(6));
    expect(ties).toHaveLength(4);

    const byes = ties.filter((t) => t.isBye);
    expect(byes.map((t) => t.bracketPosition)).toEqual([1, 2]);
    expect(byes.map((t) => t.homeTeam?.id)).toEqual([1, 2]);
    expect(
      byes.every(
        (t) =>
          t.status === "completed" &&
          t.awayTeam == null &&
          t.winnerTeam?.id === t.homeTeam?.id,
      ),
    ).toBe(true);

    const contested = ties.filter((t) => !t.isBye);
    expect(contested.map((t) => t.bracketPosition)).toEqual([3, 4]);
    expect(
      contested.map((t) => [t.homeTeam?.id, t.awayTeam?.id]),
    ).toEqual([[3, 4], [5, 6]]);
  });

  it("handles N=3 (one bye into sf)", () => {
    const ties = buildSeedPreviewTies(teams(3));
    expect(ties).toHaveLength(2);
    expect(ties[0]).toMatchObject({
      round: "sf",
      bracketPosition: 1,
      isBye: true,
    });
    expect(ties[1]).toMatchObject({ round: "sf", bracketPosition: 2 });
    expect([ties[1]!.homeTeam?.id, ties[1]!.awayTeam?.id]).toEqual([2, 3]);
  });

  it("handles N=2 (entry round is the final)", () => {
    const ties = buildSeedPreviewTies(teams(2));
    expect(ties).toHaveLength(1);
    expect(ties[0]).toMatchObject({ round: "final", bracketPosition: 1 });
  });

  it("handles N=20 (r32 entry, 12 byes)", () => {
    const ties = buildSeedPreviewTies(teams(20));
    expect(ties).toHaveLength(16);
    expect(ties.every((t) => t.round === "r32")).toBe(true);
    expect(ties.filter((t) => t.isBye)).toHaveLength(12);
    const contested = ties.filter((t) => !t.isBye);
    expect(contested[0]).toMatchObject({ bracketPosition: 13 });
    expect(
      contested.map((t) => [t.homeTeam?.id, t.awayTeam?.id]),
    ).toEqual([[13, 14], [15, 16], [17, 18], [19, 20]]);
  });

  it("uses unique negative ids", () => {
    const ties = buildSeedPreviewTies(teams(6));
    expect(ties.every((t) => t.id < 0)).toBe(true);
    expect(new Set(ties.map((t) => t.id)).size).toBe(ties.length);
  });

  it("applies the default tie config", () => {
    const ties = buildSeedPreviewTies(teams(4), {
      ties: { default: { tie_format: "best_of", best_of: 5 } },
    });
    expect(ties[0]).toMatchObject({
      tieFormat: "best_of",
      bestOf: 5,
      targetWins: 3,
    });
  });

  it("prefers the per-round override for the entry round", () => {
    const ties = buildSeedPreviewTies(teams(4), {
      ties: {
        default: { tie_format: "single" },
        rounds: { sf: { tie_format: "two_legged", away_goals: true } },
      },
    });
    expect(ties[0]).toMatchObject({ tieFormat: "two_legged", awayGoals: true });
  });
});

describe("buildBracketScaffold", () => {
  it("returns null with no bracket ties", () => {
    expect(buildBracketScaffold([])).toBeNull();
    expect(
      buildBracketScaffold([
        makeTie({ round: "third_place", bracketPosition: 1 }),
      ]),
    ).toBeNull();
  });

  it("scaffolds a qf-entry bracket with placeholders to the final", () => {
    const ties = buildSeedPreviewTies(teams(8));
    const scaffold = buildBracketScaffold(ties);
    expect(scaffold).not.toBeNull();
    expect(scaffold!.entryRound).toBe("qf");
    expect(scaffold!.bracketSize).toBe(8);
    expect(scaffold!.perSideEntryCount).toBe(2);

    expect(scaffold!.leftColumns.map((c) => c.round)).toEqual(["qf", "sf"]);
    expect(scaffold!.rightColumns.map((c) => c.round)).toEqual(["sf", "qf"]);
    expect(scaffold!.leftColumns[0]!.slots.map((s) => s.position)).toEqual([1, 2]);
    expect(
      scaffold!.rightColumns[1]!.slots.map((s) => s.position),
    ).toEqual([3, 4]);

    const sfLeft = scaffold!.leftColumns[1]!.slots;
    expect(sfLeft).toHaveLength(1);
    expect(sfLeft[0]!.tie).toBeNull();
    expect(scaffold!.final.tie).toBeNull();
    expect(scaffold!.champion).toBeNull();
    expect(scaffold!.thirdPlace).toBeNull();
  });

  it("replaces exactly the matching placeholder when a later round exists", () => {
    const qf = buildSeedPreviewTies(teams(8)).map((t, i) =>
      makeTie({ ...t, id: 100 + i }),
    );
    const sfTie = makeTie({ round: "sf", bracketPosition: 2 });
    const scaffold = buildBracketScaffold([...qf, sfTie]);

    const sfLeft = scaffold!.leftColumns[1]!.slots[0]!;
    const sfRight = scaffold!.rightColumns[0]!.slots[0]!;
    expect(sfLeft.position).toBe(1);
    expect(sfLeft.tie).toBeNull();
    expect(sfRight.position).toBe(2);
    expect(sfRight.tie?.id).toBe(sfTie.id);
  });

  it("names the champion once the final is completed", () => {
    const winner = team(1);
    const final = makeTie({
      round: "final",
      bracketPosition: 1,
      status: "completed",
      homeTeam: winner,
      awayTeam: team(2),
      winnerTeam: winner,
    });
    const scaffold = buildBracketScaffold([final]);
    expect(scaffold!.entryRound).toBe("final");
    expect(scaffold!.bracketSize).toBe(2);
    expect(scaffold!.leftColumns).toHaveLength(0);
    expect(scaffold!.rightColumns).toHaveLength(0);
    expect(scaffold!.champion?.id).toBe(1);
  });

  it("shows the third-place slot from the flag or a real tie", () => {
    const ties = buildSeedPreviewTies(teams(8));

    expect(buildBracketScaffold(ties)!.thirdPlace).toBeNull();

    const flagged = buildBracketScaffold(ties, { hasThirdPlace: true });
    expect(flagged!.thirdPlace).toMatchObject({ round: "third_place", tie: null });

    const real = makeTie({ round: "third_place", bracketPosition: 1 });
    const withReal = buildBracketScaffold([...ties, real]);
    expect(withReal!.thirdPlace?.tie?.id).toBe(real.id);
  });

  it("hides the third-place slot for a two-team bracket even when flagged", () => {
    const final = makeTie({ round: "final", bracketPosition: 1 });
    const scaffold = buildBracketScaffold([final], { hasThirdPlace: true });
    expect(scaffold!.thirdPlace).toBeNull();
  });
});

describe("byeExplanation", () => {
  it("is null for full brackets or tiny counts", () => {
    expect(byeExplanation(0)).toBeNull();
    expect(byeExplanation(1)).toBeNull();
    expect(byeExplanation(2)).toBeNull();
    expect(byeExplanation(8)).toBeNull();
  });

  it("uses singular and plural forms", () => {
    expect(byeExplanation(7)).toBe(
      "You have 7 teams; the bracket needs 8, so the top seed skips round one.",
    );
    expect(byeExplanation(6)).toBe(
      "You have 6 teams; the bracket needs 8, so the top 2 seeds skip round one.",
    );
  });
});
