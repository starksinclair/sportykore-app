import { ApiError, ApiParsedErrorPayload } from "@/api/errors";

import { acceptInvite } from "../api";
import { processInviteAccept } from "../process-invite";
import { clearPendingInviteToken } from "../storage";

jest.mock("../api", () => ({
  acceptInvite: jest.fn(),
}));

jest.mock("../storage", () => ({
  clearPendingInviteToken: jest.fn(),
}));

const mockedAcceptInvite = jest.mocked(acceptInvite);
const mockedClearToken = jest.mocked(clearPendingInviteToken);

function apiError(status: number, message = "Error", body: unknown = null) {
  return new ApiError(message, {
    status,
    url: "/api/v1/invites/accept/test-token",
    body: body as ApiParsedErrorPayload,
  });
}

describe("processInviteAccept", () => {
  beforeEach(() => {
    mockedClearToken.mockResolvedValue();
  });

  it("returns requires_profile when the API says a player profile is needed", async () => {
    mockedAcceptInvite.mockResolvedValue({
      requiresProfile: true,
      token: "test-token",
    });

    await expect(processInviteAccept("test-token")).resolves.toEqual({
      kind: "requires_profile",
    });
    expect(mockedClearToken).not.toHaveBeenCalled();
  });

  it("returns joined and clears the pending token when accept succeeds", async () => {
    mockedAcceptInvite.mockResolvedValue({
      requiresProfile: false,
      leagueId: 42,
    });

    await expect(processInviteAccept("test-token")).resolves.toEqual({
      kind: "joined",
      leagueId: 42,
    });
    expect(mockedClearToken).toHaveBeenCalledTimes(1);
  });

  it("returns error and clears token when accept succeeds without a league id", async () => {
    mockedAcceptInvite.mockResolvedValue({
      requiresProfile: false,
      leagueId: null,
    });

    await expect(processInviteAccept("test-token")).resolves.toEqual({
      kind: "error",
      message: "Invite accepted but no league was returned.",
    });
    expect(mockedClearToken).toHaveBeenCalledTimes(1);
  });

  it("returns auth_required on 401 without clearing the token", async () => {
    mockedAcceptInvite.mockRejectedValue(apiError(401, "Unauthorized"));

    await expect(processInviteAccept("test-token")).resolves.toEqual({
      kind: "auth_required",
    });
    expect(mockedClearToken).not.toHaveBeenCalled();
  });

  it("returns wrong_account on 403", async () => {
    mockedAcceptInvite.mockRejectedValue(apiError(403, "Forbidden"));

    await expect(processInviteAccept("test-token")).resolves.toEqual({
      kind: "wrong_account",
      message: "This invite is for another account.",
    });
    expect(mockedClearToken).not.toHaveBeenCalled();
  });

  it("returns invalid and clears token on 404", async () => {
    mockedAcceptInvite.mockRejectedValue(apiError(404, "Not found"));

    await expect(processInviteAccept("test-token")).resolves.toEqual({
      kind: "invalid",
      message: "This invite has expired or is no longer valid.",
    });
    expect(mockedClearToken).toHaveBeenCalledTimes(1);
  });

  it("returns already_joined and clears token on 409", async () => {
    mockedAcceptInvite.mockRejectedValue(
      apiError(409, "Conflict", { message: "You are already on this team." }),
    );

    await expect(processInviteAccept("test-token")).resolves.toEqual({
      kind: "already_joined",
      message: "You are already on this team.",
    });
    expect(mockedClearToken).toHaveBeenCalledTimes(1);
  });

  it("returns generic error for unexpected failures", async () => {
    mockedAcceptInvite.mockRejectedValue(new Error("Network down"));

    await expect(processInviteAccept("test-token")).resolves.toEqual({
      kind: "error",
      message: "Network down",
    });
    expect(mockedClearToken).not.toHaveBeenCalled();
  });
});
