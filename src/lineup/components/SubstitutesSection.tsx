import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";

import { useTheme } from "@/color/use-theme";
import { colors } from "@/constants";
import type { SubAssignment } from "@/lineup/types";
import { MAX_LINEUP_SUBSTITUTES } from "@/lineup/utils";

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
  const theme = useTheme();

  return (
    <View className="gap-3">
      <Text
        style={{ color: theme.text }}
      >
        Substitutes
      </Text>

      {subs.length > 0 ? (
        <View className="flex-row flex-wrap gap-2">
          {subs.map((sub) => (
            <View
              key={sub.playerId}
              className="flex-row items-center gap-2 rounded-xl px-3 py-2"
              style={{ backgroundColor: theme.cardMuted }}
            >
              <Text
                className="text-sm"
                style={{ color: theme.text }}
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
                    color={theme.textSubtle}
                  />
                </Pressable>
              ) : null}
            </View>
          ))}
        </View>
      ) : (
        <Text
          className="text-sm"
          style={{ color: theme.textSubtle }}
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
          style={{ borderColor: theme.accent }}
        >
          <Ionicons name="add-circle" size={22} color={colors.accent} />
          <Text style={{ color: isDark ? colors.accent : theme.accent }}>
            Add sub
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}
