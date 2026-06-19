import { act, render, screen, waitFor } from "@testing-library/react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

import { useAuth } from "@/auth";
import { setPendingInviteToken } from "@/invite";

import JoinInvitePage from "../[token]";

jest.mock("expo-router", () => ({
  useRouter: jest.fn(),
  useLocalSearchParams: jest.fn(),
}));

jest.mock("@/auth", () => ({
  useAuth: jest.fn(),
}));

jest.mock("@/invite", () => ({
  setPendingInviteToken: jest.fn(),
}));

const mockedUseRouter = jest.mocked(useRouter);
const mockedUseLocalSearchParams = jest.mocked(useLocalSearchParams);
const mockedUseAuth = jest.mocked(useAuth);
const mockedSetPendingInviteToken = jest.mocked(setPendingInviteToken);

const TOKEN = "test-invite-token";
const LEAGUE_NAME = "Surulere Sunday League";
const TEAM_NAME = "Mainland FC";

function mockAuthState(user: { id: number } | null = null) {
  mockedUseAuth.mockReturnValue({
    user,
  } as ReturnType<typeof useAuth>);
}

describe("JoinInvitePage", () => {
  const replace = jest.fn();
  const push = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseRouter.mockReturnValue({ replace, push } as unknown as ReturnType<typeof useRouter>);
    mockedUseLocalSearchParams.mockReturnValue({
      token: TOKEN,
      leagueName: LEAGUE_NAME,
      teamName: TEAM_NAME,
    });
    mockedSetPendingInviteToken.mockResolvedValue();
  });

  it("persists the invite token and context when the page loads", async () => {
    mockAuthState();

    await act(async () => {
      render(<JoinInvitePage />);
    });

    await waitFor(() => {
      expect(mockedSetPendingInviteToken).toHaveBeenCalledWith(TOKEN, {
        leagueName: LEAGUE_NAME,
        teamName: TEAM_NAME,
      });
    });
  });

  it("shows league and team context for a logged-out user", async () => {
    mockAuthState(null);

    await act(async () => {
      render(<JoinInvitePage />);
    });

    expect(await screen.findByText("You've been invited")).toBeTruthy();
    expect(screen.getByText(LEAGUE_NAME)).toBeTruthy();
    expect(screen.getByText(TEAM_NAME)).toBeTruthy();
    expect(screen.getByText("Continue with email")).toBeTruthy();
    expect(screen.getByText("Create account")).toBeTruthy();
  });

  it("redirects logged-in users to invite-handler after storing the token", async () => {
    mockAuthState({ id: 1 });

    await act(async () => {
      render(<JoinInvitePage />);
    });

    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith("/join/invite-handler");
    });
  });
});
