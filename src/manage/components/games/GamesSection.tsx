import { Text, View } from "react-native";

import type { ApiGame } from "@/api/entities";
import { PulsingDot } from "@/components/ui/pulsing-dot";
import { fonts } from "@/theme/fonts";

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
  return (
    <View className="gap-3">
      {title ? (
        <View className="flex-row items-center gap-2">
          {showLiveDot ? <PulsingDot color="#E6A817" size={8} /> : null}
          <Text
            style={{ fontFamily: fonts.bodyBold }}
            className="text-xs uppercase tracking-[2px] text-white/45"
          >
            {title}
          </Text>
        </View>
      ) : null}
      {games.length === 0 ? (
        <Text style={{ fontFamily: fonts.body }} className="text-sm text-white/45">
          {emptyMessage}
        </Text>
      ) : (
        games.map((game) => (
          <ManageGameRow
            key={game.id}
            game={game}
            leagueId={leagueId}
            seasonId={seasonId}
            variant={variant}
          />
        ))
      )}
    </View>
  );
}
