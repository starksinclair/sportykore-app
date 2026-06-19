import type { Router } from "expo-router";

import { ApiError } from "@/api/errors";

import { acceptInvite, completeProfileAndAccept } from "../api";
import { processInviteAccept } from "../process-invite";
import {
  navigateForInviteOutcome,
  resumeInviteFlow,
} from "../resume-invite";
import {
  clearPendingInviteToken,
  getPendingInviteToken,
  setPendingInviteToken,
} from "../storage";

jest.mock("../api", () => ({
  acceptInvite: jest.fn(),
  completeProfileAndAccept: jest.fn(),
}));

const mockedAcceptInvite = jest.mocked(acceptInvite);
const mockedCompleteProfile = jest.mocked(completeProfileAndAccept);

function createRouter(): Router {
  return { replace: jest.fn() } as unknown as Router;
}

describe("invite player routing scenarios", () => {
  beforeEach(async () => {
    await clearPendingInviteToken();
    jest.clearAllMocks();
  });

  describe("new user opens invite link", () => {
    it("persists the token so auth can resume the flow after signup", async () => {
      const token = "invite-new-user";

      await setPendingInviteToken(token);
      await expect(getPendingInviteToken()).resolves.toBe(token);
    });

    it("after registration, resume sends a new user to create-profile when required", async () => {
      const router = createRouter();
      const token = "invite-needs-profile";

      await setPendingInviteToken(token);
      mockedAcceptInvite.mockResolvedValue({
        requiresProfile: true,
        token,
      });

      await resumeInviteFlow(router);

      expect(mockedAcceptInvite).toHaveBeenCalledWith(token);
      expect(router.replace).toHaveBeenCalledWith("/join/create-profile");
      await expect(getPendingInviteToken()).resolves.toBe(token);
    });

    it("after registration, resume joins the league when the user already has a profile", async () => {
      const router = createRouter();
      const token = "invite-ready-to-join";

      await setPendingInviteToken(token);
      mockedAcceptInvite.mockResolvedValue({
        requiresProfile: false,
        leagueId: 12,
      });

      await resumeInviteFlow(router);

      expect(router.replace).toHaveBeenCalledWith("/league/12");
      await expect(getPendingInviteToken()).resolves.toBeNull();
    });

    it("profile completion clears the stored token", async () => {
      const token = "invite-profile-step";
      await setPendingInviteToken(token);

      mockedAcceptInvite.mockResolvedValue({
        requiresProfile: true,
        token,
      });
      await expect(processInviteAccept(token)).resolves.toEqual({
        kind: "requires_profile",
      });

      mockedCompleteProfile.mockResolvedValue({ leagueId: 55 });
      await completeProfileAndAccept(token, { name: "Alex Morgan", countryId: 1 });
      await clearPendingInviteToken();

      expect(mockedCompleteProfile).toHaveBeenCalledWith(token, {
        name: "Alex Morgan",
        countryId: 1,
      });
      await expect(getPendingInviteToken()).resolves.toBeNull();
    });
  });

  describe("authenticated user opens invite link", () => {
    it("joins immediately when accept returns a league id", async () => {
      const router = createRouter();
      const token = "invite-existing-user";

      mockedAcceptInvite.mockResolvedValue({
        requiresProfile: false,
        leagueId: 3,
      });

      const outcome = await processInviteAccept(token);
      navigateForInviteOutcome(outcome, token, router);

      expect(outcome).toEqual({ kind: "joined", leagueId: 3 });
      expect(router.replace).toHaveBeenCalledWith("/league/3");
      await expect(getPendingInviteToken()).resolves.toBeNull();
    });

    it("routes to create-profile when the account has no player profile yet", async () => {
      const router = createRouter();
      const token = "invite-auth-no-profile";

      mockedAcceptInvite.mockResolvedValue({
        requiresProfile: true,
        token,
      });

      const outcome = await processInviteAccept(token);
      navigateForInviteOutcome(outcome, token, router);

      expect(outcome).toEqual({ kind: "requires_profile" });
      expect(router.replace).toHaveBeenCalledWith("/join/create-profile");
    });

    it("sends the user back to the join screen when the invite is for another account", async () => {
      const router = createRouter();
      const token = "invite-wrong-account";

      mockedAcceptInvite.mockRejectedValue(
        new ApiError("Forbidden", { status: 403, url: "/test", body: null }),
      );

      const outcome = await processInviteAccept(token);
      navigateForInviteOutcome(outcome, token, router);

      expect(outcome).toEqual({
        kind: "wrong_account",
        message: "This invite is for another account.",
      });
      expect(router.replace).toHaveBeenCalledWith(`/join/${token}`);
    });

    it("clears an expired invite and returns to the join screen", async () => {
      const router = createRouter();
      const token = "invite-expired";

      mockedAcceptInvite.mockRejectedValue(
        new ApiError("Not found", { status: 404, url: "/test", body: null }),
      );

      const outcome = await processInviteAccept(token);
      navigateForInviteOutcome(outcome, token, router);

      expect(outcome.kind).toBe("invalid");
      expect(router.replace).toHaveBeenCalledWith(`/join/${token}`);
      await expect(getPendingInviteToken()).resolves.toBeNull();
    });
  });

  describe("logged-out user on join screen", () => {
    it("keeps the token when accept would require auth", async () => {
      const token = "invite-logged-out";
      await setPendingInviteToken(token);

      mockedAcceptInvite.mockRejectedValue(
        new ApiError("Unauthorized", { status: 401, url: "/test", body: null }),
      );

      const outcome = await processInviteAccept(token);

      expect(outcome).toEqual({ kind: "auth_required" });
      await expect(getPendingInviteToken()).resolves.toBe(token);
    });
  });
});
