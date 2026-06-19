import type { Router } from "expo-router";

import { processInviteAccept } from "../process-invite";
import {
  messageForInviteOutcome,
  navigateForInviteOutcome,
  processInviteAcceptOnce,
  resumeInviteFlow,
} from "../resume-invite";
import { getPendingInviteToken } from "../storage";
import type { ProcessInviteOutcome } from "../types";

jest.mock("../process-invite", () => ({
  processInviteAccept: jest.fn(),
}));

jest.mock("../storage", () => ({
  getPendingInviteToken: jest.fn(),
}));

const mockedProcessInviteAccept = jest.mocked(processInviteAccept);
const mockedGetPendingInviteToken = jest.mocked(getPendingInviteToken);

function createRouter(): Router {
  return { replace: jest.fn() } as unknown as Router;
}

async function flushAcceptOnceInflight() {
  mockedProcessInviteAccept.mockResolvedValue({ kind: "joined", leagueId: 1 });
  await processInviteAcceptOnce("flush-token");
}

describe("navigateForInviteOutcome", () => {
  const token = "abc-token";
  let router: Router;

  beforeEach(() => {
    router = createRouter();
  });

  it.each<[ProcessInviteOutcome, string]>([
    [{ kind: "requires_profile" }, "/join/create-profile"],
    [{ kind: "joined", leagueId: 99 }, "/league/99"],
    [{ kind: "auth_required" }, `/join/${token}`],
    [{ kind: "wrong_account", message: "wrong" }, `/join/${token}`],
    [{ kind: "invalid", message: "invalid" }, `/join/${token}`],
    [{ kind: "already_joined", message: "joined" }, `/join/${token}`],
    [{ kind: "error", message: "err" }, `/join/${token}`],
  ])("navigates for %j", (outcome, expectedPath) => {
    navigateForInviteOutcome(outcome, token, router);
    expect(router.replace).toHaveBeenCalledWith(expectedPath);
  });
});

describe("messageForInviteOutcome", () => {
  it("returns null for success outcomes", () => {
    expect(messageForInviteOutcome({ kind: "requires_profile" }, false)).toBeNull();
    expect(messageForInviteOutcome({ kind: "joined", leagueId: 1 }, true)).toBeNull();
  });

  it("returns different copy for auth_required depending on login state", () => {
    expect(messageForInviteOutcome({ kind: "auth_required" }, false)).toBe(
      "Please sign in to accept this invite.",
    );
    expect(messageForInviteOutcome({ kind: "auth_required" }, true)).toBe(
      "Couldn't verify your session. Tap Retry.",
    );
  });

  it("returns backend messages for failure outcomes", () => {
    expect(
      messageForInviteOutcome(
        { kind: "wrong_account", message: "This invite is for another account." },
        true,
      ),
    ).toBe("This invite is for another account.");
  });
});

describe("processInviteAcceptOnce", () => {
  afterEach(async () => {
    await flushAcceptOnceInflight();
    jest.clearAllMocks();
  });

  it("dedupes parallel calls for the same token", async () => {
    let resolveAccept!: (value: ProcessInviteOutcome) => void;
    const deferred = new Promise<ProcessInviteOutcome>((resolve) => {
      resolveAccept = resolve;
    });
    mockedProcessInviteAccept.mockReturnValueOnce(deferred);

    const first = processInviteAcceptOnce("same-token");
    const second = processInviteAcceptOnce("same-token");

    expect(first).toBe(second);
    expect(mockedProcessInviteAccept).toHaveBeenCalledTimes(1);

    resolveAccept({ kind: "joined", leagueId: 5 });
    await expect(first).resolves.toEqual({ kind: "joined", leagueId: 5 });
  });

  it("starts a new accept when the token changes", async () => {
    mockedProcessInviteAccept
      .mockResolvedValueOnce({ kind: "joined", leagueId: 1 })
      .mockResolvedValueOnce({ kind: "requires_profile" });

    await processInviteAcceptOnce("token-a");
    await processInviteAcceptOnce("token-b");

    expect(mockedProcessInviteAccept).toHaveBeenNthCalledWith(1, "token-a");
    expect(mockedProcessInviteAccept).toHaveBeenNthCalledWith(2, "token-b");
  });
});

describe("resumeInviteFlow", () => {
  let router: Router;

  beforeEach(() => {
    router = createRouter();
    jest.clearAllMocks();
  });

  afterEach(async () => {
    await flushAcceptOnceInflight();
  });

  it("returns false when there is no pending invite token", async () => {
    mockedGetPendingInviteToken.mockResolvedValue(null);

    await expect(resumeInviteFlow(router)).resolves.toBe(false);
    expect(mockedProcessInviteAccept).not.toHaveBeenCalled();
    expect(router.replace).not.toHaveBeenCalled();
  });

  it("accepts the pending token and navigates when one exists", async () => {
    mockedGetPendingInviteToken.mockResolvedValue("pending-token");
    mockedProcessInviteAccept.mockResolvedValue({ kind: "joined", leagueId: 7 });

    await expect(resumeInviteFlow(router)).resolves.toBe(true);
    expect(mockedProcessInviteAccept).toHaveBeenCalledWith("pending-token");
    expect(router.replace).toHaveBeenCalledWith("/league/7");
  });
});
