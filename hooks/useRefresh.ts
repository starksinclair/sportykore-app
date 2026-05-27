import { useCallback, useState } from "react";

function useRefresh(
  refetchers: (() => Promise<any>)[],
): [boolean, () => Promise<void>] {
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all(refetchers.map((fn) => fn()));
    } finally {
      setRefreshing(false);
    }
  }, [refetchers]);

  return [refreshing, onRefresh];
}

export default useRefresh;
