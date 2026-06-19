import type { Router } from "expo-router";

import { ApiError } from "@/api/errors";

import { acceptInvite } from "../api";
import { processInviteAccept } from "../process-invite";
import { resumeInviteFlow } from "../resume-invite";
import {
  clearPendingInviteToken,
  getPendingInviteToken,
  setPendingInviteToken,
} from "../storage";

jest.mock("../api", () => ({
  acceptInvite: jest.fn(),
}));

const mockedAcceptInvite = jest.mocked(acceptInvite);

function createRouter(): Router {
  return { replace: jest.fn() } as unknown as Router;
}

describe("auth screens resume invite flow", () => {
  beforeEach(async () => {
    await clearPendingInviteToken();
    jest.clearAllMocks();
  });

  it("login continuation accepts a stored invite for a returning user", async () => {
    const router = createRouter();
    await setPendingInviteToken("post-login-token");
    mockedAcceptInvite.mockResolvedValue({
      requiresProfile: false,
      leagueId: 18,
    });

    await resumeInviteFlow(router);

    expect(mockedAcceptInvite).toHaveBeenCalledWith("post-login-token");
    expect(router.replace).toHaveBeenCalledWith("/league/18");
  });

  it("register continuation routes new users without a profile to create-profile", async () => {
    const router = createRouter();
    await setPendingInviteToken("post-register-token");
    mockedAcceptInvite.mockResolvedValue({
      requiresProfile: true,
      token: "post-register-token",
    });

    await resumeInviteFlow(router);

    expect(router.replace).toHaveBeenCalledWith("/join/create-profile");
    await expect(getPendingInviteToken()).resolves.toBe("post-register-token");
  });

  it("does not navigate when login happens without a pending invite", async () => {
    const router = createRouter();

    await expect(resumeInviteFlow(router)).resolves.toBe(false);
    expect(router.replace).not.toHaveBeenCalled();
    expect(mockedAcceptInvite).not.toHaveBeenCalled();
  });

  it("keeps the pending token when accept still requires authentication", async () => {
    const router = createRouter();
    await setPendingInviteToken("still-needs-auth");
    mockedAcceptInvite.mockRejectedValue(
      new ApiError("Unauthorized", { status: 401, url: "/test", body: null }),
    );

    await resumeInviteFlow(router);

    expect(router.replace).toHaveBeenCalledWith("/join/still-needs-auth");
    await expect(getPendingInviteToken()).resolves.toBe("still-needs-auth");
    await expect(processInviteAccept("still-needs-auth")).resolves.toEqual({
      kind: "auth_required",
    });
  });
});
