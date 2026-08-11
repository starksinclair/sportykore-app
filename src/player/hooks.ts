import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNetworkStatus } from "hooks/useNetworkStatus";

import type { ApiPlayerHighlight } from "@/api/entities";
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
  type OwnPlayerProfileResult,
  type PlayerProfilePayload,
  type UpdateHighlightPayload,
} from "./api";
import type { PlayerDetail } from "./types";

export const playerKeys = {
  all: ["player"] as const,
  hasProfile: () => [...playerKeys.all, "has-profile"] as const,
  ownProfile: () => [...playerKeys.all, "me"] as const,
  ownHighlights: () => [...playerKeys.ownProfile(), "highlights"] as const,
  detail: (playerId: number) => [...playerKeys.all, playerId] as const,
};

type HighlightSnapshot = {
  ownProfile?: OwnPlayerProfileResult;
  ownHighlights?: ApiPlayerHighlight[];
  detail?: PlayerDetail;
};

function upsertHighlight(
  highlights: ApiPlayerHighlight[] | undefined,
  highlight: ApiPlayerHighlight,
): ApiPlayerHighlight[] {
  const rows = highlights ?? [];
  const exists = rows.some((row) => row.id === highlight.id);
  const next = exists
    ? rows.map((row) => (row.id === highlight.id ? highlight : row))
    : [...rows, highlight];
  return next.sort((a, b) => a.sortOrder - b.sortOrder);
}

function patchHighlight(
  highlights: ApiPlayerHighlight[] | undefined,
  id: number,
  patch: Partial<ApiPlayerHighlight>,
): ApiPlayerHighlight[] {
  return (highlights ?? []).map((row) =>
    row.id === id ? { ...row, ...patch } : row,
  );
}

function removeHighlight(
  highlights: ApiPlayerHighlight[] | undefined,
  id: number,
): ApiPlayerHighlight[] {
  return (highlights ?? []).filter((row) => row.id !== id);
}

function patchOwnProfileHighlights(
  profile: OwnPlayerProfileResult | undefined,
  updater: (highlights: ApiPlayerHighlight[] | undefined) => ApiPlayerHighlight[],
): OwnPlayerProfileResult | undefined {
  if (!profile || profile.kind !== "profile") return profile;
  const highlights = updater(profile.data.player.highlights);
  return {
    ...profile,
    data: {
      ...profile.data,
      highlightsCount: highlights.length,
      player: {
        ...profile.data.player,
        highlights,
      },
    },
  };
}

function patchPlayerDetailHighlights(
  detail: PlayerDetail | undefined,
  updater: (highlights: ApiPlayerHighlight[] | undefined) => ApiPlayerHighlight[],
): PlayerDetail | undefined {
  if (!detail) return detail;
  return {
    ...detail,
    player: {
      ...detail.player,
      highlights: updater(detail.player.highlights),
    },
  };
}

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
    onSuccess: (highlight) => {
      queryClient.setQueryData<ApiPlayerHighlight[]>(
        playerKeys.ownHighlights(),
        (old) => upsertHighlight(old, highlight),
      );
      queryClient.setQueryData<OwnPlayerProfileResult>(
        playerKeys.ownProfile(),
        (old) =>
          patchOwnProfileHighlights(old, (highlights) =>
            upsertHighlight(highlights, highlight),
          ),
      );
      if (playerId) {
        queryClient.setQueryData<PlayerDetail>(
          playerKeys.detail(playerId),
          (old) =>
            patchPlayerDetailHighlights(old, (highlights) =>
              upsertHighlight(highlights, highlight),
            ),
        );
      }
      invalidate();
    },
  });

  const update = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: UpdateHighlightPayload;
    }) => updateHighlight(id, payload),
    onMutate: async ({ id, payload }): Promise<HighlightSnapshot> => {
      await queryClient.cancelQueries({ queryKey: playerKeys.ownHighlights() });
      await queryClient.cancelQueries({ queryKey: playerKeys.ownProfile() });
      if (playerId) {
        await queryClient.cancelQueries({ queryKey: playerKeys.detail(playerId) });
      }
      const snapshot: HighlightSnapshot = {
        ownProfile: queryClient.getQueryData(playerKeys.ownProfile()),
        ownHighlights: queryClient.getQueryData(playerKeys.ownHighlights()),
        detail: playerId
          ? queryClient.getQueryData(playerKeys.detail(playerId))
          : undefined,
      };
      queryClient.setQueryData<ApiPlayerHighlight[]>(
        playerKeys.ownHighlights(),
        (old) => patchHighlight(old, id, payload),
      );
      queryClient.setQueryData<OwnPlayerProfileResult>(
        playerKeys.ownProfile(),
        (old) =>
          patchOwnProfileHighlights(old, (highlights) =>
            patchHighlight(highlights, id, payload),
          ),
      );
      if (playerId) {
        queryClient.setQueryData<PlayerDetail>(
          playerKeys.detail(playerId),
          (old) =>
            patchPlayerDetailHighlights(old, (highlights) =>
              patchHighlight(highlights, id, payload),
            ),
        );
      }
      return snapshot;
    },
    onSuccess: (highlight) => {
      queryClient.setQueryData<ApiPlayerHighlight[]>(
        playerKeys.ownHighlights(),
        (old) => upsertHighlight(old, highlight),
      );
      queryClient.setQueryData<OwnPlayerProfileResult>(
        playerKeys.ownProfile(),
        (old) =>
          patchOwnProfileHighlights(old, (highlights) =>
            upsertHighlight(highlights, highlight),
          ),
      );
      if (playerId) {
        queryClient.setQueryData<PlayerDetail>(
          playerKeys.detail(playerId),
          (old) =>
            patchPlayerDetailHighlights(old, (highlights) =>
              upsertHighlight(highlights, highlight),
            ),
        );
      }
    },
    onError: (err, _variables, context) => {
      if (context?.ownProfile) {
        queryClient.setQueryData(playerKeys.ownProfile(), context.ownProfile);
      }
      if (context?.ownHighlights) {
        queryClient.setQueryData(
          playerKeys.ownHighlights(),
          context.ownHighlights,
        );
      }
      if (playerId && context?.detail) {
        queryClient.setQueryData(playerKeys.detail(playerId), context.detail);
      }
      showThrownAsToast(err, "Could not update highlight");
    },
    onSettled: invalidate,
  });

  const remove = useMutation({
    mutationFn: (id: number) => deleteHighlight(id),
    onMutate: async (id): Promise<HighlightSnapshot> => {
      await queryClient.cancelQueries({ queryKey: playerKeys.ownHighlights() });
      await queryClient.cancelQueries({ queryKey: playerKeys.ownProfile() });
      if (playerId) {
        await queryClient.cancelQueries({ queryKey: playerKeys.detail(playerId) });
      }
      const snapshot: HighlightSnapshot = {
        ownProfile: queryClient.getQueryData(playerKeys.ownProfile()),
        ownHighlights: queryClient.getQueryData(playerKeys.ownHighlights()),
        detail: playerId
          ? queryClient.getQueryData(playerKeys.detail(playerId))
          : undefined,
      };
      queryClient.setQueryData<ApiPlayerHighlight[]>(
        playerKeys.ownHighlights(),
        (old) => removeHighlight(old, id),
      );
      queryClient.setQueryData<OwnPlayerProfileResult>(
        playerKeys.ownProfile(),
        (old) =>
          patchOwnProfileHighlights(old, (highlights) =>
            removeHighlight(highlights, id),
          ),
      );
      if (playerId) {
        queryClient.setQueryData<PlayerDetail>(
          playerKeys.detail(playerId),
          (old) =>
            patchPlayerDetailHighlights(old, (highlights) =>
              removeHighlight(highlights, id),
            ),
        );
      }
      return snapshot;
    },
    onError: (err, _id, context) => {
      if (context?.ownProfile) {
        queryClient.setQueryData(playerKeys.ownProfile(), context.ownProfile);
      }
      if (context?.ownHighlights) {
        queryClient.setQueryData(
          playerKeys.ownHighlights(),
          context.ownHighlights,
        );
      }
      if (playerId && context?.detail) {
        queryClient.setQueryData(playerKeys.detail(playerId), context.detail);
      }
      showThrownAsToast(err, "Could not delete highlight");
    },
    onSettled: invalidate,
  });

  return { create, update, remove };
}
