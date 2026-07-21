import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNetworkStatus } from "hooks/useNetworkStatus";

import { showThrownAsToast } from "@/lib/show-error-toast";

import {
  createHighlight,
  createPlayerProfile,
  deleteHighlight,
  fetchDoesUserHavePlayerProfile,
  fetchOwnHighlights,
  fetchOwnPlayerProfile,
  fetchPlayerDetail,
  updateHighlight,
  updatePlayerProfile,
  uploadPlayerPhoto,
  type CreateHighlightPayload,
  type CreatePlayerProfilePayload,
  type PlayerProfilePayload,
  type UpdateHighlightPayload,
} from "./api";

export const playerKeys = {
  all: ["player"] as const,
  hasProfile: () => [...playerKeys.all, "has-profile"] as const,
  ownProfile: () => [...playerKeys.all, "me"] as const,
  ownHighlights: () => [...playerKeys.ownProfile(), "highlights"] as const,
  detail: (playerId: number) => [...playerKeys.all, playerId] as const,
};

export function useDoesUserHavePlayerProfile(enabled: boolean) {
  const { isOnline } = useNetworkStatus();
  return useQuery({
    queryKey: playerKeys.hasProfile(),
    queryFn: () => fetchDoesUserHavePlayerProfile(),
    enabled,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    networkMode: isOnline ? "online" : "offlineFirst",
  });
}

export function usePlayerDetail(playerId: number) {
  const { isOnline } = useNetworkStatus();
  return useQuery({
    queryKey: playerKeys.detail(playerId),
    queryFn: () => fetchPlayerDetail(playerId),
    enabled: playerId > 0,
    staleTime: 5 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
    networkMode: isOnline ? "online" : "offlineFirst",
    placeholderData: (previousData) => previousData,
  });
}

export function useOwnPlayerProfile(enabled: boolean) {
  const { isOnline } = useNetworkStatus();
  return useQuery({
    queryKey: playerKeys.ownProfile(),
    queryFn: () => fetchOwnPlayerProfile(),
    enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
    networkMode: isOnline ? "online" : "offlineFirst",
    placeholderData: (previousData) => previousData,
  });
}

export function useOwnHighlights(enabled: boolean) {
  const { isOnline } = useNetworkStatus();
  return useQuery({
    queryKey: playerKeys.ownHighlights(),
    queryFn: () => fetchOwnHighlights(),
    enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
    networkMode: isOnline ? "online" : "offlineFirst",
    placeholderData: (previousData) => previousData,
  });
}

export function usePlayerProfileMutations() {
  const queryClient = useQueryClient();
  const invalidateOwnProfile = () => {
    void queryClient.invalidateQueries({ queryKey: playerKeys.ownProfile() });
    void queryClient.invalidateQueries({ queryKey: playerKeys.hasProfile() });
  };

  const create = useMutation({
    mutationFn: (payload: CreatePlayerProfilePayload) =>
      createPlayerProfile(payload),
    onSuccess: (player) => {
      invalidateOwnProfile();
      void queryClient.invalidateQueries({ queryKey: playerKeys.detail(player.id) });
    },
    onError: (err) => showThrownAsToast(err, "Could not create profile"),
  });

  const update = useMutation({
    mutationFn: (payload: PlayerProfilePayload) => updatePlayerProfile(payload),
    onSuccess: (player) => {
      invalidateOwnProfile();
      void queryClient.invalidateQueries({ queryKey: playerKeys.detail(player.id) });
    },
    onError: (err) => showThrownAsToast(err, "Could not save profile"),
  });

  const photo = useMutation({
    mutationFn: uploadPlayerPhoto,
    onSuccess: (player) => {
      invalidateOwnProfile();
      void queryClient.invalidateQueries({ queryKey: playerKeys.detail(player.id) });
    },
    onError: (err) => showThrownAsToast(err, "Could not upload photo"),
  });

  return { create, update, photo };
}

export function useHighlightMutations(playerId?: number) {
  const queryClient = useQueryClient();
  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: playerKeys.ownProfile() });
    void queryClient.invalidateQueries({ queryKey: playerKeys.ownHighlights() });
    if (playerId) {
      void queryClient.invalidateQueries({ queryKey: playerKeys.detail(playerId) });
    }
  };

  const create = useMutation({
    mutationFn: (payload: CreateHighlightPayload) => createHighlight(payload),
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: UpdateHighlightPayload;
    }) => updateHighlight(id, payload),
    onSuccess: invalidate,
    onError: (err) => showThrownAsToast(err, "Could not update highlight"),
  });

  const remove = useMutation({
    mutationFn: (id: number) => deleteHighlight(id),
    onSuccess: invalidate,
    onError: (err) => showThrownAsToast(err, "Could not delete highlight"),
  });

  return { create, update, remove };
}
