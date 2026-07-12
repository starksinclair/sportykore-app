import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";

import { colors } from "@/constants";

type Props = {
  children?: ReactNode;
};

const STRIPE_COUNT = 12;

export function FootballPitch({ children }: Props) {
  return (
    <View className="w-full overflow-hidden rounded-[20px] border-2 border-accent-400" style={styles.wrapper}>
      {/* <LinearGradient
        colors={[colors.brand, colors.brand600]}
        style={StyleSheet.absoluteFill}
      /> */}
      {Array.from({ length: STRIPE_COUNT }, (_, i) => (
        <View
          key={i}
          style={[
            styles.stripe,
            {
              top: `${(i / STRIPE_COUNT) * 100}%`,
              height: `${100 / STRIPE_COUNT}%`,
              backgroundColor: i % 2 === 0 ? colors.brand : colors.brand600,
            },
          ]}
        />
      ))}
      <View style={styles.markings} pointerEvents="none">
        <View style={styles.outerBorder} />
        <View style={styles.halfLine} />
        <View style={styles.centerCircle} />
        {/* <View style={[styles.penaltyBox, styles.penaltyTop]} /> */}
        {/* <View style={[styles.penaltyBox, styles.penaltyBottom]} /> */}
        <View style={[styles.goalArea, styles.goalTop]} />
        <View style={[styles.goalArea, styles.goalBottom]} />
      </View>
      <View style={styles.slotsLayer}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    aspectRatio: 3 / 4,
    position: "relative",
  },
  stripe: {
    position: "absolute",
    left: 0,
    right: 0,
  },
  markings: {
    ...StyleSheet.absoluteFillObject,
  },
  outerBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 18,
    margin: 6,
  },
  halfLine: {
    position: "absolute",
    left: "6%",
    right: "6%",
    top: "48%",
    height: 2,
    backgroundColor: colors.accent,
    opacity: 0.85,
  },
  centerCircle: {
    position: "absolute",
    width: "22%",
    aspectRatio: 1,
    borderRadius: 9999,
    borderWidth: 2,
    borderColor: colors.accent,
    top: "50%",
    left: "50%",
    marginLeft: "-11%",
    marginTop: "-11%",
    opacity: 0.85,
  },
  penaltyBox: {
    position: "absolute",
    left: "22%",
    right: "22%",
    height: "16%",
    borderWidth: 2,
    borderColor: colors.accent,
    opacity: 0.75,
  },
  penaltyTop: {
    top: "6%",
    borderTopWidth: 0,
  },
  penaltyBottom: {
    bottom: "6%",
    borderBottomWidth: 0,
  },
  goalArea: {
    position: "absolute",
    left: "34%",
    right: "34%",
    height: "7%",
    borderWidth: 2,
    borderColor: colors.accent,
    opacity: 0.65,
  },
  goalTop: {
    top: "6%",
    borderTopWidth: 0,
  },
  goalBottom: {
    bottom: "6%",
    borderBottomWidth: 0,
  },
  slotsLayer: {
    ...StyleSheet.absoluteFillObject,
    padding: 8,
  },
});
