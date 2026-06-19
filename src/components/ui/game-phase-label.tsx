import { Text, type TextProps } from "react-native";

import { useGamePhaseLabel } from "@/hooks/useGamePhaseLabel";
import type { GameClockFields } from "@/lib/game-time";
import { fonts } from "@/theme/fonts";

type Props = TextProps & {
  game: GameClockFields;
  textClassName?: string;
};

export function GamePhaseLabel({
  game,
  textClassName,
  style,
  ...rest
}: Props) {
  const label = useGamePhaseLabel(game);

  return (
    <Text
      style={[{ fontFamily: fonts.bodySemibold }, style]}
      className={textClassName}
      {...rest}
    >
      {label}
    </Text>
  );
}
