import { useQuery } from "@tanstack/react-query";
import { useNetworkStatus } from "hooks/useNetworkStatus";

import { fetchCountries, fetchCountryDetail } from "./api";

export function useCountryDetail(id: string) {
  return useQuery({
    queryKey: ["country-detail", id],
    queryFn: () => fetchCountryDetail(id),
    enabled: Boolean(id),
  });
}

export function useCountries() {
  const { isOnline } = useNetworkStatus();
  return useQuery({
    queryKey: ["countries"],
    queryFn: fetchCountries,
    staleTime: 5 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
    networkMode: isOnline ? "online" : "offlineFirst",
    placeholderData: (previousData) => previousData,
  });
}
