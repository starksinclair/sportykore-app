import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

import { fonts } from "@/theme/fonts";

export type PlayerRowAction = {
  key: string;
  icon: keyof typeof Ionicons.glyphMap;
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
};

/** Player row with icon action buttons on the right (goal, assist, cards, save). */
export function PlayerActionRow({ name, jersey, actions }: ActionRowProps) {
  const anySelected = actions.some((a) => a.selected);

  return (
    <View
      className={`mb-2 flex-row items-center justify-between rounded-xl px-3 py-3 ${
        anySelected ? "bg-brand-500/20" : "bg-white/8"
      }`}
    >
      <View className="mr-2 flex-1 flex-row items-center gap-3">
        <Text
          style={{ fontFamily: fonts.body }}
          className="w-8 text-xs text-white/45"
        >
          {jersey ? `#${jersey}` : "—"}
        </Text>
        <Text
          style={{ fontFamily: fonts.bodySemibold }}
          className="flex-1 text-sm text-white"
          numberOfLines={1}
        >
          {name}
        </Text>
      </View>
      <View className="flex-row items-center gap-1.5">
        {actions.map((action) => (
          <Pressable
            key={action.key}
            onPress={action.onPress}
            disabled={action.disabled || action.loading}
            accessibilityRole="button"
            accessibilityLabel={action.accessibilityLabel}
            className={`h-9 w-9 items-center justify-center rounded-lg ${
              action.selected ? "bg-accent-500/30" : "bg-white/10"
            } ${action.disabled ? "opacity-35" : ""}`}
          >
            {action.loading ? (
              <ActivityIndicator size="small" color={action.color} />
            ) : (
              <Ionicons name={action.icon} size={20} color={action.color} />
            )}
          </Pressable>
        ))}
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
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      className={`mb-2 flex-row items-center justify-between rounded-xl px-3 py-3 ${
        selected ? "bg-brand-500/35" : "bg-white/8"
      } ${disabled ? "opacity-50" : ""}`}
    >
      <View className="flex-row items-center gap-3">
        <Text
          style={{ fontFamily: fonts.body }}
          className="w-8 text-xs text-white/45"
        >
          {jersey ? `#${jersey}` : "—"}
        </Text>
        <Text style={{ fontFamily: fonts.bodySemibold }} className="text-sm text-white">
          {name}
        </Text>
      </View>
      {loading ? (
        <ActivityIndicator size="small" color="#E6A817" />
      ) : trailingIcon ? (
        <Ionicons name={trailingIcon} size={20} color="#E6A817" />
      ) : selected ? (
        <Ionicons name="checkmark-circle" size={20} color="#E6A817" />
      ) : (
        <Ionicons name="ellipse-outline" size={20} color="rgba(255,255,255,0.25)" />
      )}
    </Pressable>
  );
}
