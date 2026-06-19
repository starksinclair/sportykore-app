import { useMutation, useQuery } from "@tanstack/react-query";

import {
    acceptInvite,
    completeProfileAndAccept,
    generateInvite,
    searchLeagueUsers,
} from "./api";
import type { CompleteProfilePayload, GenerateInviteParams } from "./types";

export const inviteKeys = {
  search: (leagueId: number, query: string) =>
    ["invite", "search", leagueId, query] as const,
};

export function useSearchLeagueUsers(
  leagueId: number,
  query: string,
  enabled: boolean,
) {
  return useQuery({
    queryKey: inviteKeys.search(leagueId, query),
    queryFn: () => searchLeagueUsers(leagueId, query),
    enabled: enabled && leagueId > 0 && query.trim().length >= 2,
    staleTime: 30 * 1000,
  });
}

export function useGenerateInvite() {
  return useMutation({
    mutationFn: (params: GenerateInviteParams) => generateInvite(params),
  });
}

export function useCompleteProfileAndAccept() {
  return useMutation({
    mutationFn: ({
      token,
      payload,
    }: {
      token: string;
      payload: CompleteProfilePayload;
    }) => completeProfileAndAccept(token, payload),
  });
}

export function useAcceptInvite() {
    return useMutation({
        mutationFn: (token: string) =>  acceptInvite(token)
    })
}