import AsyncStorage from "@react-native-async-storage/async-storage";

const PENDING_INVITE_TOKEN_KEY = "pendingInviteToken";
const PENDING_INVITE_LEAGUE_NAME_KEY = "pendingInviteLeagueName";
const PENDING_INVITE_TEAM_NAME_KEY = "pendingInviteTeamName";

export type PendingInviteContext = {
  leagueName?: string;
  teamName?: string;
};

export async function getPendingInviteToken(): Promise<string | null> {
  const value = await AsyncStorage.getItem(PENDING_INVITE_TOKEN_KEY);
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export async function getPendingInviteContext(): Promise<PendingInviteContext> {
  const [leagueName, teamName] = await Promise.all([
    AsyncStorage.getItem(PENDING_INVITE_LEAGUE_NAME_KEY),
    AsyncStorage.getItem(PENDING_INVITE_TEAM_NAME_KEY),
  ]);

  return {
    leagueName: leagueName?.trim() || undefined,
    teamName: teamName?.trim() || undefined,
  };
}

export async function setPendingInviteToken(
  token: string,
  context?: PendingInviteContext,
): Promise<void> {
  const writes: Promise<void>[] = [
    AsyncStorage.setItem(PENDING_INVITE_TOKEN_KEY, token.trim()),
  ];

  if (context?.leagueName?.trim()) {
    writes.push(
      AsyncStorage.setItem(PENDING_INVITE_LEAGUE_NAME_KEY, context.leagueName.trim()),
    );
  } else {
    writes.push(AsyncStorage.removeItem(PENDING_INVITE_LEAGUE_NAME_KEY));
  }

  if (context?.teamName?.trim()) {
    writes.push(
      AsyncStorage.setItem(PENDING_INVITE_TEAM_NAME_KEY, context.teamName.trim()),
    );
  } else {
    writes.push(AsyncStorage.removeItem(PENDING_INVITE_TEAM_NAME_KEY));
  }

  await Promise.all(writes);
}

export async function clearPendingInviteToken(): Promise<void> {
  await Promise.all([
    AsyncStorage.removeItem(PENDING_INVITE_TOKEN_KEY),
    AsyncStorage.removeItem(PENDING_INVITE_LEAGUE_NAME_KEY),
    AsyncStorage.removeItem(PENDING_INVITE_TEAM_NAME_KEY),
  ]);
}
