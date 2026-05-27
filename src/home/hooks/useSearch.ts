import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useNetworkStatus } from "hooks/useNetworkStatus";

import { search } from "../api/search";
import type { SearchParams } from "../types";
import { homeKeys } from "./queryKeys";

function useDebouncedValue<T>(value: T, delay = 200): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);

  return debounced;
}

export function useSearch(params: SearchParams) {
  const { isOnline } = useNetworkStatus();
  const debouncedQuery = useDebouncedValue(params.q, 180);
  const effective: SearchParams = { ...params, q: debouncedQuery };
  const trimmed = debouncedQuery.trim();

  return useQuery({
    queryKey: homeKeys.search(effective),
    queryFn: () => search(effective),
    enabled: trimmed.length >= 1,
    staleTime: 5 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
    networkMode: isOnline ? "online" : "offlineFirst",
    placeholderData: (previousData) => previousData,
  });
}
