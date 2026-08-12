import { Text, View } from "react-native";

import type { ApiGame } from "@/api/entities";
import { PulsingDot } from "@/components/ui/pulsing-dot";
import { useAdaptiveLayout } from "@/hooks/useAdaptiveLayout";

import { ManageGameRow } from "./ManageGameRow";

type Props = {
  title?: string;
  games: ApiGame[];
  leagueId: number;
  seasonId: number;
  variant: "live" | "upcoming" | "results";
  emptyMessage: string;
  showLiveDot?: boolean;
};

export function GamesSection({
  title,
  games,
  leagueId,
  seasonId,
  variant,
  emptyMessage,
  showLiveDot,
}: Props) {
  const { isTablet } = useAdaptiveLayout();

  return (
    <View className="gap-3">
      {title ? (
        <View className="flex-row items-center gap-2">
          {showLiveDot ? <PulsingDot color="#E6A817" size={8} /> : null}
          <Text
            className="text-xs uppercase tracking-[2px] text-white/45"
          >
            {title}
          </Text>
        </View>
      ) : null}
      {games.length === 0 ? (
        <Text className="text-sm text-white/45">
          {emptyMessage}
        </Text>
      ) : (
        <View className={isTablet ? "flex-row flex-wrap gap-3" : "gap-3"}>
          {games.map((game) => (
            <View
              key={game.id}
              style={isTablet ? { width: "48%" } : undefined}
            >
              <ManageGameRow
                game={game}
                leagueId={leagueId}
                seasonId={seasonId}
                variant={variant}
              />
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
