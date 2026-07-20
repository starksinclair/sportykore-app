import { Ionicons } from "@expo/vector-icons";
import { Fragment, memo, useMemo } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import type { ApiTie } from "@/api/entities";
import { colors } from "@/constants";
import { fonts } from "@/theme/fonts";

import {
  buildBracketScaffold,
  type BracketColumn,
  type BracketSlot,
} from "../bracket";
import { roundLabel } from "../utils";
import { TieCard } from "./TieCard";

const CARD_W = 132;
const SLOT_H = 96;
const CONN_W = 22;
const HEADER_H = 28;
const CENTER_W = 168;
const MIN_GRID_H = 300;
const FRAME_PAD = 12;
const STRIPE_H = 56;
const CIRCLE_R = 84;
const GOLD_LINE = "rgba(230, 168, 23, 0.55)";
const GOLD_FAINT = "rgba(230, 168, 23, 0.16)";

type Props = {
  ties: ApiTie[];
  isLoading?: boolean;
  /** Drives the loading/empty states; the bracket grid itself is always pitch-themed. */
  tone?: "light" | "dark";
  onTiePress?: (tie: ApiTie) => void;
  /** Show the third-place placeholder before the tie exists (from stage config). */
  hasThirdPlace?: boolean;
};

export function BracketView({
  ties,
  isLoading,
  tone = "dark",
  onTiePress,
  hasThirdPlace,
}: Props) {
  const isDark = tone === "dark";
  const scaffold = useMemo(
    () => buildBracketScaffold(ties, { hasThirdPlace }),
    [ties, hasThirdPlace],
  );

  if (isLoading) {
    return (
      <View className="items-center py-12">
        <ActivityIndicator color={isDark ? "#E6A817" : "#4A148C"} />
      </View>
    );
  }

  if (!scaffold) {
    return (
      <View
        className={`rounded-[22px] border border-dashed px-5 py-8 ${
          isDark
            ? "border-white/15 bg-white/5"
            : "border-slate-200 bg-slate-50"
        }`}
      >
        <Text
          style={{ fontFamily: fonts.bodyBold }}
          className={`text-base ${isDark ? "text-white" : "text-slate-900"}`}
        >
          Bracket not ready
        </Text>
        <Text
          style={{ fontFamily: fonts.body }}
          className={`pt-2 text-sm leading-6 ${
            isDark ? "text-white/55" : "text-slate-600"
          }`}
        >
          Seed the stage to generate ties and fixtures.
        </Text>
      </View>
    );
  }

  const gridHeight = Math.max(scaffold.perSideEntryCount * SLOT_H, MIN_GRID_H);
  const totalHeight = HEADER_H + gridHeight + FRAME_PAD * 2;
  const leftWidth = scaffold.leftColumns.length * (CARD_W + CONN_W);
  const centerX = FRAME_PAD + leftWidth + CENTER_W / 2;
  const centerY = FRAME_PAD + HEADER_H + gridHeight / 2;

  return (
    <View style={styles.frame}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        removeClippedSubviews
      >
        <View style={styles.contentRow}>
          <PitchStripes height={totalHeight} />
          <View
            pointerEvents="none"
            style={[styles.halfwayLine, { left: centerX - 1 }]}
          />
          <View
            pointerEvents="none"
            style={[
              styles.centerCircle,
              { left: centerX - CIRCLE_R, top: centerY - CIRCLE_R },
            ]}
          />

          {scaffold.leftColumns.map((column) => (
            <Fragment key={`L-${column.round}`}>
              <RoundColumn
                column={column}
                gridHeight={gridHeight}
                onTiePress={onTiePress}
              />
              <ConnectorColumn
                side="left"
                sourceCount={column.slots.length}
                gridHeight={gridHeight}
              />
            </Fragment>
          ))}

          <View style={[styles.centerColumn, { height: HEADER_H + gridHeight }]}>
            <Text style={styles.roundHeader}>{roundLabel("final")}</Text>
            <View style={styles.trophyBlock}>
              <Ionicons
                name="trophy"
                size={40}
                color={colors.accent}
                style={{ opacity: scaffold.champion ? 1 : 0.45 }}
              />
              {scaffold.champion ? (
                <>
                  <Text style={styles.championCaption}>Champion</Text>
                  <Text style={styles.championName} numberOfLines={1}>
                    {scaffold.champion.name}
                  </Text>
                </>
              ) : (
                <Text style={styles.championTbd}>Champion TBD</Text>
              )}
            </View>
            <BracketSlotView slot={scaffold.final} onTiePress={onTiePress} />
            {scaffold.thirdPlace ? (
              <View style={styles.thirdPlaceBlock}>
                <Text style={styles.thirdPlaceCaption}>
                  {roundLabel("third_place")}
                </Text>
                <BracketSlotView
                  slot={scaffold.thirdPlace}
                  onTiePress={onTiePress}
                />
              </View>
            ) : null}
          </View>

          {scaffold.rightColumns.map((column) => (
            <Fragment key={`R-${column.round}`}>
              <ConnectorColumn
                side="right"
                sourceCount={column.slots.length}
                gridHeight={gridHeight}
              />
              <RoundColumn
                column={column}
                gridHeight={gridHeight}
                onTiePress={onTiePress}
              />
            </Fragment>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const PitchStripes = memo(function PitchStripes({ height }: { height: number }) {
  const count = Math.ceil(height / STRIPE_H);
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {Array.from({ length: count }, (_, i) => (
        <View
          key={i}
          style={{
            height: STRIPE_H,
            backgroundColor: i % 2 === 0 ? colors.brand : colors.brand600,
          }}
        />
      ))}
    </View>
  );
});

const RoundColumn = memo(function RoundColumn({
  column,
  gridHeight,
  onTiePress,
}: {
  column: BracketColumn;
  gridHeight: number;
  onTiePress?: (tie: ApiTie) => void;
}) {
  return (
    <View style={styles.roundColumn}>
      <Text style={styles.roundHeader} numberOfLines={1}>
        {roundLabel(column.round)}
      </Text>
      <View style={{ height: gridHeight }}>
        {column.slots.map((slot) => (
          <View key={slot.key} style={styles.slotWrap}>
            <BracketSlotView slot={slot} onTiePress={onTiePress} />
          </View>
        ))}
      </View>
    </View>
  );
});

/**
 * Gold elbow connectors between a round column and the next round inward.
 * Slot wrappers divide gridHeight evenly, so an elbow of height
 * gridHeight / sourceCount centered in each pair segment lands its top and
 * bottom borders exactly on the two source card centers.
 */
const ConnectorColumn = memo(function ConnectorColumn({
  side,
  sourceCount,
  gridHeight,
}: {
  side: "left" | "right";
  sourceCount: number;
  gridHeight: number;
}) {
  if (sourceCount <= 1) {
    return (
      <View style={styles.connector}>
        <View style={styles.connectorLine} />
      </View>
    );
  }
  const elbowHeight = gridHeight / sourceCount;
  const borderSide =
    side === "left" ? styles.elbowLeftSide : styles.elbowRightSide;
  return (
    <View style={styles.connector}>
      {Array.from({ length: sourceCount / 2 }, (_, i) => (
        <View key={i} style={styles.connectorSegment}>
          <View style={[styles.elbow, borderSide, { height: elbowHeight }]} />
        </View>
      ))}
    </View>
  );
});

const BracketSlotView = memo(function BracketSlotView({
  slot,
  onTiePress,
}: {
  slot: BracketSlot;
  onTiePress?: (tie: ApiTie) => void;
}) {
  if (slot.tie) {
    return <TieCard tie={slot.tie} variant="bracket" onPress={onTiePress} />;
  }
  return (
    <View style={styles.placeholder}>
      <Text style={styles.placeholderTeam}>TBD</Text>
      <Text style={styles.placeholderVs}>vs</Text>
      <Text style={styles.placeholderTeam}>TBD</Text>
    </View>
  );
});

const styles = StyleSheet.create({
  frame: {
    borderRadius: 20,
    borderWidth: 2,
    borderColor: colors.accent,
    backgroundColor: colors.brand,
    overflow: "hidden",
  },
  contentRow: {
    flexDirection: "row",
    padding: FRAME_PAD,
  },
  halfwayLine: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: GOLD_FAINT,
  },
  centerCircle: {
    position: "absolute",
    width: CIRCLE_R * 2,
    height: CIRCLE_R * 2,
    borderRadius: CIRCLE_R,
    borderWidth: 2,
    borderColor: GOLD_FAINT,
  },
  roundColumn: {
    width: CARD_W,
  },
  roundHeader: {
    height: HEADER_H,
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    textAlign: "center",
    color: "rgba(255, 255, 255, 0.45)",
  },
  slotWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  connector: {
    width: CONN_W,
    marginTop: HEADER_H,
    justifyContent: "center",
    alignSelf: "stretch",
  },
  connectorSegment: {
    flex: 1,
    justifyContent: "center",
  },
  connectorLine: {
    height: 2,
    width: "100%",
    backgroundColor: GOLD_LINE,
  },
  elbow: {
    width: "100%",
    borderTopWidth: 2,
    borderBottomWidth: 2,
    borderColor: GOLD_LINE,
  },
  elbowLeftSide: {
    borderRightWidth: 2,
  },
  elbowRightSide: {
    borderLeftWidth: 2,
  },
  centerColumn: {
    width: CENTER_W,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  trophyBlock: {
    alignItems: "center",
    gap: 2,
  },
  championCaption: {
    fontFamily: fonts.bodySemibold,
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: "rgba(255, 255, 255, 0.6)",
  },
  championName: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: "#F1BC2F",
    maxWidth: CENTER_W - 16,
  },
  championTbd: {
    fontFamily: fonts.bodySemibold,
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.4)",
  },
  thirdPlaceBlock: {
    alignItems: "center",
    gap: 4,
    marginTop: 8,
  },
  thirdPlaceCaption: {
    fontFamily: fonts.bodySemibold,
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: "rgba(255, 255, 255, 0.45)",
  },
  placeholder: {
    width: CARD_W,
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: "rgba(230, 168, 23, 0.25)",
    backgroundColor: "rgba(30, 8, 56, 0.6)",
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  placeholderTeam: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.3)",
  },
  placeholderVs: {
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    textAlign: "center",
    paddingVertical: 2,
    color: "rgba(255, 255, 255, 0.2)",
  },
});
