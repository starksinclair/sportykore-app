import AsyncStorage from "@react-native-async-storage/async-storage";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { QueryClient } from "@tanstack/react-query";
import { persistQueryClient } from "@tanstack/react-query-persist-client";
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // data is considered fresh for 5 minutes
      staleTime: 1000 * 60 * 5,
      // keep in cache for 24 hours (for offline use)
      gcTime: 1000 * 60 * 60 * 24,
      // don't retry when offline — fail fast and use cache
      retry: (failureCount, error: any) => {
        if (error?.status === 403 || error?.status === 404) return false;
        return failureCount < 2;
      },
    },
  },
});

export const persister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: "SOCCER_APP_CACHE",
  // only persist important queries
  throttleTime: 3000,
});

persistQueryClient({
  queryClient,
  persister,
  maxAge: 1000 * 60 * 60 * 24, // 24 hours
});
