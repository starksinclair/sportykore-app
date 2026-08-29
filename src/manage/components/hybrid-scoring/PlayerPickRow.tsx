import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

import { useTheme } from "@/color/use-theme";

export type PlayerRowAction = {
  key: string;
  icon: keyof typeof Ionicons.glyphMap;
  label?: string;
  color: string;
  selected?: boolean;
  disabled?: boolean;
  loading?: boolean;
  onPress: () => void;
  accessibilityLabel: string;
};

type ActionRowProps = {
  name: string;
  jersey: string | null;
  actions: PlayerRowAction[];
  density?: "normal" | "compact";
};

/** Player row with icon action buttons on the right (goal, assist, cards, save). */
export function PlayerActionRow({
  name,
  jersey,
  actions,
  density = "normal",
}: ActionRowProps) {
  const theme = useTheme();
  const anySelected = actions.some((a) => a.selected);
  const compact = density === "compact";

  return (
    <View
      className={`${compact ? "mb-1.5 rounded-lg px-2.5 py-2" : "mb-2 rounded-xl px-3 py-3"} flex-row items-center justify-between`}
      style={{
        backgroundColor: anySelected ? theme.brandMuted : theme.cardMuted,
      }}
    >
      <View className="mr-2 min-w-0 flex-1 flex-row items-center gap-2">
        <Text
          className={`${compact ? "w-7" : "w-8"} text-xs`}
          style={{ color: theme.textSubtle }}
        >
          {jersey ? `#${jersey}` : "-"}
        </Text>
        <Text
          className={`${compact ? "text-[13px]" : "text-sm"} min-w-0 flex-1`}
          style={{ color: theme.text }}
          numberOfLines={1}
        >
          {name}
        </Text>
      </View>
      <View className={`flex-row items-center ${compact ? "gap-1" : "gap-1.5"}`}>
        {actions.map((action) => {
          const selected = Boolean(action.selected);
          const disabled = Boolean(action.disabled);
          return (
            <Pressable
              key={action.key}
              onPress={action.onPress}
              disabled={disabled || action.loading}
              accessibilityRole="button"
              accessibilityLabel={action.accessibilityLabel}
              className={`flex-row items-center justify-center gap-1 rounded-full ${
                compact && action.label ? "h-8 min-w-[4rem] px-2" : "h-9 w-9"
              } ${disabled ? "opacity-35" : ""}`}
              style={{
                backgroundColor: selected ? theme.accent : theme.card,
              }}
            >
              {action.loading ? (
                <ActivityIndicator
                  size="small"
                  color={selected ? theme.textInverse : action.color}
                />
              ) : (
                <>
                  <Ionicons
                    name={action.icon}
                    size={compact ? 15 : 20}
                    color={selected ? theme.textInverse : action.color}
                  />
                  {action.label ? (
                    <Text
                      className="text-[11px]"
                      style={{
                        color: selected ? theme.textInverse : theme.textMuted,
                      }}
                      numberOfLines={1}
                    >
                      {action.label}
                    </Text>
                  ) : null}
                </>
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

type LegacyProps = {
  name: string;
  jersey: string | null;
  selected?: boolean;
  loading?: boolean;
  disabled?: boolean;
  onPress: () => void;
  trailingIcon?: keyof typeof Ionicons.glyphMap;
};

/** @deprecated Prefer PlayerActionRow with explicit icon actions. */
export function PlayerPickRow({
  name,
  jersey,
  selected = false,
  loading = false,
  disabled = false,
  onPress,
  trailingIcon,
}: LegacyProps) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      className={`mb-2 flex-row items-center justify-between rounded-xl px-3 py-3 ${
        disabled ? "opacity-50" : ""
      }`}
      style={{
        backgroundColor: selected ? theme.brandMuted : theme.cardMuted,
      }}
    >
      <View className="flex-row items-center gap-3">
        <Text
          className="w-8 text-xs"
          style={{ color: theme.textSubtle }}
        >
          {jersey ? `#${jersey}` : "-"}
        </Text>
        <Text className="text-sm" style={{ color: theme.text }}>
          {name}
        </Text>
      </View>
      {loading ? (
        <ActivityIndicator size="small" color={theme.accent} />
      ) : trailingIcon ? (
        <Ionicons name={trailingIcon} size={20} color={theme.accent} />
      ) : selected ? (
        <Ionicons name="checkmark-circle" size={20} color={theme.accent} />
      ) : (
        <Ionicons name="ellipse-outline" size={20} color={theme.textSubtle} />
      )}
    </Pressable>
  );
}
