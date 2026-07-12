import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";

import { colors } from "@/constants";
import type { SubAssignment } from "@/lineup/types";
import { MAX_LINEUP_SUBSTITUTES } from "@/lineup/utils";
import { fonts } from "@/theme/fonts";

type Props = {
  subs: SubAssignment[];
  readOnly?: boolean;
  onAdd: () => void;
  onRemove: (playerId: number) => void;
  tone?: "light" | "dark";
};

export function SubstitutesSection({
  subs,
  readOnly = false,
  onAdd,
  onRemove,
  tone = "dark",
}: Props) {
  const isDark = tone === "dark";

  return (
    <View className="gap-3">
      <Text
        style={{ fontFamily: fonts.bodyBold }}
        className={isDark ? "text-white" : "text-neutral-900"}
      >
        Substitutes
      </Text>

      {subs.length > 0 ? (
        <View className="flex-row flex-wrap gap-2">
          {subs.map((sub) => (
            <View
              key={sub.playerId}
              className={[
                "flex-row items-center gap-2 rounded-xl px-3 py-2",
                isDark ? "bg-white/10" : "bg-neutral-100",
              ].join(" ")}
            >
              <Text
                style={{ fontFamily: fonts.bodySemibold }}
                className={isDark ? "text-sm text-white" : "text-sm text-neutral-900"}
              >
                {sub.jerseyNumber != null ? `#${sub.jerseyNumber} ` : ""}
                {sub.playerName}
              </Text>
              {!readOnly ? (
                <Pressable
                  onPress={() => onRemove(sub.playerId)}
                  hitSlop={8}
                  accessibilityLabel={`Remove ${sub.playerName}`}
                >
                  <Ionicons
                    name="close-circle"
                    size={18}
                    color={isDark ? "rgba(255,255,255,0.5)" : "#9CA3AF"}
                  />
                </Pressable>
              ) : null}
            </View>
          ))}
        </View>
      ) : (
        <Text
          style={{ fontFamily: fonts.body }}
          className={isDark ? "text-sm text-white/45" : "text-sm text-neutral-500"}
        >
          No substitutes selected yet.
        </Text>
      )}

      {!readOnly && subs.length < MAX_LINEUP_SUBSTITUTES ? (
        <Pressable
          onPress={onAdd}
          accessibilityRole="button"
          accessibilityLabel="Add substitute"
          className="flex-row items-center justify-center gap-2 rounded-xl border-2 border-dashed border-accent-400 py-3 active:opacity-80"
        >
          <Ionicons name="add-circle" size={22} color={colors.accent} />
          <Text style={{ fontFamily: fonts.bodyBold }} className="text-accent-300">
            Add sub
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}
