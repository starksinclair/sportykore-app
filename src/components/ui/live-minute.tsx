import { Text, View } from "react-native";

import type { GameClockFields } from "@/lib/game-time";
import {
  isGameClockTicking,
  isGameLivePeriod,
} from "@/lib/game-time";
import { useGamePhaseLabel } from "@/hooks/useGamePhaseLabel";
import { PulsingDot } from "@/components/ui/pulsing-dot";
import { fonts } from "@/theme/fonts";

type Props = {
  game: GameClockFields;
  textClassName?: string;
  showLiveDot?: boolean;
};

export function LiveMinute({ game, textClassName, showLiveDot = true }: Props) {
  const label = useGamePhaseLabel(game);
  const ticking = isGameClockTicking(game.status);
  const livePeriod = isGameLivePeriod(game.status);

  return (
    <View className="flex-row items-center justify-center gap-2">
      {showLiveDot && livePeriod && ticking ? (
        <PulsingDot color="#ef4444" size={8} />
      ) : null}
      <Text
        style={{ fontFamily: fonts.bodyBold }}
        className={textClassName ?? "text-xs uppercase tracking-wide text-white/45"}
      >
        {label}
      </Text>
    </View>
  );
}
