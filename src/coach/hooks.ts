import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNetworkStatus } from "hooks/useNetworkStatus";

import type { ApiCoachProfile } from "@/api/entities";
import { showThrownAsToast } from "@/lib/show-error-toast";

import {
  createCoachProfile,
  fetchCoachProfile,
  fetchOwnCoachProfile,
  updateCoachProfile,
  uploadCoachPhoto,
  type CoachProfilePayload,
  type CreateCoachProfilePayload,
  type OwnCoachProfileResult,
} from "./api";

export const coachKeys = {
  all: ["coach"] as const,
  ownProfile: () => [...coachKeys.all, "me"] as const,
  detail: (coachId: number) => [...coachKeys.all, coachId] as const,
};

export function useCoachProfile(coachId: number) {
  const { isOnline } = useNetworkStatus();
  return useQuery({
    queryKey: coachKeys.detail(coachId),
    queryFn: () => fetchCoachProfile(coachId),
    enabled: coachId > 0,
    staleTime: 5 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
    networkMode: isOnline ? "online" : "offlineFirst",
    placeholderData: (previousData) => previousData,
  });
}

export function useOwnCoachProfile(enabled: boolean) {
  const { isOnline } = useNetworkStatus();
  return useQuery({
    queryKey: coachKeys.ownProfile(),
    queryFn: () => fetchOwnCoachProfile(),
    enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
    networkMode: isOnline ? "online" : "offlineFirst",
    placeholderData: (previousData) => previousData,
  });
}

export function useCoachProfileMutations() {
  const queryClient = useQueryClient();

  const setOwnProfile = (coach: ApiCoachProfile) => {
    queryClient.setQueryData<OwnCoachProfileResult>(
      coachKeys.ownProfile(),
      { kind: "profile", coach },
    );
    queryClient.setQueryData<ApiCoachProfile>(coachKeys.detail(coach.id), coach);
  };

  const create = useMutation({
    mutationFn: (payload: CreateCoachProfilePayload) => createCoachProfile(payload),
    onSuccess: setOwnProfile,
    onError: (err) => showThrownAsToast(err, "Could not create coach profile"),
  });

  const update = useMutation({
    mutationFn: (payload: CoachProfilePayload) => updateCoachProfile(payload),
    onSuccess: setOwnProfile,
    onError: (err) => showThrownAsToast(err, "Could not save coach profile"),
  });

  const photo = useMutation({
    mutationFn: uploadCoachPhoto,
    onSuccess: setOwnProfile,
    onError: (err) => showThrownAsToast(err, "Could not upload coach photo"),
  });

  return { create, update, photo };
}
