import { ApiError } from "@/api/errors";

import { acceptInvite, completeProfileAndAccept } from "../api";
import { processInviteAccept } from "../invite-utils";
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

describe("invite player routing scenarios", () => {
  beforeEach(async () => {
    await clearPendingInviteToken();
    jest.clearAllMocks();
  });

  describe("new user opens invite link", () => {
    it("persists the token so the user can join manually after auth", async () => {
      const token = "invite-new-user";

      await setPendingInviteToken(token);
      await expect(getPendingInviteToken()).resolves.toBe(token);
    });

    it("accept returns requires_profile for a new user without auto-navigation", async () => {
      const token = "invite-needs-profile";

      mockedAcceptInvite.mockResolvedValue({
        requiresProfile: true,
        token,
      });

      await expect(processInviteAccept(token)).resolves.toEqual({
        kind: "requires_profile",
      });
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
      const token = "invite-existing-user";

      mockedAcceptInvite.mockResolvedValue({
        requiresProfile: false,
        leagueId: 3,
      });

      const outcome = await processInviteAccept(token);

      expect(outcome).toEqual({ kind: "joined", leagueId: 3 });
      await expect(getPendingInviteToken()).resolves.toBeNull();
    });

    it("returns requires_profile when the account has no player profile yet", async () => {
      const token = "invite-auth-no-profile";

      mockedAcceptInvite.mockResolvedValue({
        requiresProfile: true,
        token,
      });

      const outcome = await processInviteAccept(token);

      expect(outcome).toEqual({ kind: "requires_profile" });
    });

    it("returns wrong_account when the invite is for another account", async () => {
      const token = "invite-wrong-account";

      mockedAcceptInvite.mockRejectedValue(
        new ApiError("Forbidden", { status: 403, url: "/test", body: null }),
      );

      const outcome = await processInviteAccept(token);

      expect(outcome).toEqual({
        kind: "wrong_account",
        message: "This invite is for another account.",
      });
    });

    it("clears an expired invite token", async () => {
      const token = "invite-expired";
      await setPendingInviteToken(token);

      mockedAcceptInvite.mockRejectedValue(
        new ApiError("Not found", { status: 404, url: "/test", body: null }),
      );

      const outcome = await processInviteAccept(token);

      expect(outcome.kind).toBe("invalid");
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
