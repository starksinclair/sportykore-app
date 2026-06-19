import { useQueryClient } from "@tanstack/react-query";
import { useEffect, type ReactNode } from "react";

import { getTransmitManager } from "./manager";

type Props = {
  children: ReactNode;
};

export function TransmitProvider({ children }: Props) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const manager = getTransmitManager();
    manager.init(queryClient);

    const unsubscribe = queryClient.getQueryCache().subscribe(() => {
      manager.syncChannels();
    });

    return () => {
      unsubscribe();
      manager.destroy();
    };
  }, [queryClient]);

  return children;
}
