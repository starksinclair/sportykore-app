import { useMemo } from "react";
import { Dimensions, StyleSheet, View, type ViewStyle } from "react-native";

const BASE_COLOR = "#0a0a0a";
const STRIPE_COLOR = "rgba(255, 179, 0, 0.08)";

export type BlackPatternBackgroundProps = {
  baseColor?: string;
  stripeColor?: string;
  spacing?: number;
  stripeWidth?: number;
  style?: ViewStyle;
};

/**
 * React Native version of:
 * repeating-linear-gradient(-45deg, #0a0a0a 0 18px, rgba(255,179,0,.08) 18px 20px)
 */
export function BlackPatternBackground({
  baseColor = BASE_COLOR,
  stripeColor = STRIPE_COLOR,
  spacing = 20,
  stripeWidth = 2,
  style,
}: BlackPatternBackgroundProps) {
  const { width, height } = Dimensions.get("window");
  const diagonal = Math.hypot(width, height) * 1.8;

  const stripes = useMemo(() => {
    const count = Math.ceil((width + height) / spacing) + 16;
    const start = -count * spacing * 0.35;

    return Array.from({ length: count }, (_, index) => ({
      key: `stripe-${index}`,
      left: start + index * spacing,
    }));
  }, [height, spacing, width]);

  return (
    <View
      pointerEvents="none"
      style={[
        StyleSheet.absoluteFillObject,
        { backgroundColor: baseColor },
        style,
      ]}
    >
      <View style={styles.clip}>
        {stripes.map((stripe) => (
          <View
            key={stripe.key}
            style={[
              styles.stripe,
              {
                left: stripe.left,
                width: stripeWidth,
                height: diagonal,
                top: -diagonal * 0.25,
                backgroundColor: stripeColor,
                transform: [{ rotate: "-45deg" }],
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  clip: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
  stripe: {
    position: "absolute",
  },
});
