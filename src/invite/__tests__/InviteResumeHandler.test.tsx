import { render, waitFor } from "@testing-library/react-native";
import { useRouter, useSegments } from "expo-router";

import { useAuth } from "@/auth";
import { getPendingInviteToken } from "@/invite/storage";
import { InviteResumeHandler } from "@/invite/components/InviteResumeHandler";

jest.mock("expo-router", () => ({
  useRouter: jest.fn(),
  useSegments: jest.fn(),
}));

jest.mock("@/auth", () => ({
  useAuth: jest.fn(),
}));

jest.mock("@/invite/storage", () => ({
  getPendingInviteToken: jest.fn(),
}));

const mockedUseRouter = jest.mocked(useRouter);
const mockedUseSegments = jest.mocked(useSegments);
const mockedUseAuth = jest.mocked(useAuth);
const mockedGetPendingInviteToken = jest.mocked(getPendingInviteToken);

describe("InviteResumeHandler", () => {
  const replace = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseRouter.mockReturnValue({ replace } as unknown as ReturnType<typeof useRouter>);
    mockedUseAuth.mockReturnValue({
      user: { id: "1", email: "test@example.com" },
    } as ReturnType<typeof useAuth>);
    mockedGetPendingInviteToken.mockResolvedValue("stored-token");
  });

  it("routes to invite-handler when logged in with a pending token off the join route", async () => {
    mockedUseSegments.mockReturnValue(["(app)", "(tabs)"]);

    render(<InviteResumeHandler />);

    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith("/join/invite-handler");
    });
  });

  it("does nothing while the user is already on a join route", async () => {
    mockedUseSegments.mockReturnValue(
      ["join", "abc"] as unknown as ReturnType<typeof useSegments>,
    );

    render(<InviteResumeHandler />);

    await waitFor(() => {
      expect(mockedGetPendingInviteToken).not.toHaveBeenCalled();
    });
    expect(replace).not.toHaveBeenCalled();
  });

  it("does nothing when there is no logged-in user", async () => {
    mockedUseAuth.mockReturnValue({
      user: null,
    } as ReturnType<typeof useAuth>);
    mockedUseSegments.mockReturnValue(["(app)", "(tabs)"]);

    render(<InviteResumeHandler />);

    await waitFor(() => {
      expect(mockedGetPendingInviteToken).not.toHaveBeenCalled();
    });
    expect(replace).not.toHaveBeenCalled();
  });

  it("does nothing when there is no pending token", async () => {
    mockedGetPendingInviteToken.mockResolvedValue(null);
    mockedUseSegments.mockReturnValue(["(app)", "(tabs)"]);

    render(<InviteResumeHandler />);

    await waitFor(() => {
      expect(mockedGetPendingInviteToken).toHaveBeenCalled();
    });
    expect(replace).not.toHaveBeenCalled();
  });
});
