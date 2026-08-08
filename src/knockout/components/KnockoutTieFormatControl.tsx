import { Pressable, Text, TextInput, View } from "react-native";

import type { KnockoutStageConfig, KnockoutTieConfig, TieFormat } from "@/api/entities";

export type TieFormatSelection =
  | { kind: "single" }
  | { kind: "two_legged"; awayGoals?: boolean }
  | { kind: "best_of"; bestOf: number };

type Props = {
  value: TieFormatSelection;
  onChange: (value: TieFormatSelection) => void;
  hasThirdPlace: boolean;
  onHasThirdPlaceChange: (value: boolean) => void;
  tone?: "light" | "dark";
};

const PRESETS: { id: string; label: string; selection: TieFormatSelection }[] = [
  { id: "single", label: "Single match", selection: { kind: "single" } },
  {
    id: "two",
    label: "Home & away",
    selection: { kind: "two_legged", awayGoals: false },
  },
  { id: "bo3", label: "Best of 3", selection: { kind: "best_of", bestOf: 3 } },
  { id: "custom", label: "Custom best of N", selection: { kind: "best_of", bestOf: 5 } },
];

export function selectionToTieConfig(value: TieFormatSelection): KnockoutTieConfig {
  if (value.kind === "single") {
    return { tie_format: "single" };
  }
  if (value.kind === "two_legged") {
    return {
      tie_format: "two_legged",
      away_goals: value.awayGoals ?? false,
    };
  }
  return { tie_format: "best_of", best_of: value.bestOf };
}

export function buildKnockoutConfig(
  value: TieFormatSelection,
  hasThirdPlace: boolean,
): KnockoutStageConfig {
  return {
    format: { has_third_place: hasThirdPlace },
    ties: { default: selectionToTieConfig(value) },
  };
}

export function KnockoutTieFormatControl({
  value,
  onChange,
  hasThirdPlace,
  onHasThirdPlaceChange,
  tone = "light",
}: Props) {
  const isDark = tone === "dark";
  const isCustomBestOf =
    value.kind === "best_of" && value.bestOf !== 3;

  const activePresetId = (() => {
    if (value.kind === "single") return "single";
    if (value.kind === "two_legged") return "two";
    if (value.kind === "best_of" && value.bestOf === 3) return "bo3";
    return "custom";
  })();

  return (
    <View className="gap-3">
      <Text
        className={`text-xs uppercase tracking-wide ${
          isDark ? "text-white/45" : "text-slate-500"
        }`}
      >
        Tie format
      </Text>
      <View className="flex-row flex-wrap gap-2">
        {PRESETS.map((preset) => {
          const active = activePresetId === preset.id;
          return (
            <Pressable
              key={preset.id}
              onPress={() => onChange(preset.selection)}
              style={{ maxWidth: "100%" }}
              className={`rounded-xl border px-3 py-2 ${
                active
                  ? isDark
                    ? "border-brand-400 bg-brand-500/30"
                    : "border-brand-500 bg-brand-50"
                  : isDark
                    ? "border-white/15 bg-white/5"
                    : "border-slate-200 bg-slate-50"
              }`}
            >
              <Text
                className={
                  active
                    ? isDark
                      ? "text-white"
                      : "text-brand-700"
                    : isDark
                      ? "text-white/70"
                      : "text-slate-800"
                }
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {preset.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {isCustomBestOf || activePresetId === "custom" ? (
        <View className="flex-row items-center gap-3">
          <Text
            className={isDark ? "text-sm text-white/70" : "text-sm text-slate-600"}
          >
            Best of
          </Text>
          <TextInput
            value={String(value.kind === "best_of" ? value.bestOf : 5)}
            onChangeText={(text) => {
              const n = Number(text.replace(/\D/g, ""));
              if (!Number.isFinite(n) || n < 1) {
                onChange({ kind: "best_of", bestOf: 1 });
                return;
              }
              onChange({ kind: "best_of", bestOf: Math.min(15, n) });
            }}
            keyboardType="number-pad"
            className={`h-11 w-20 rounded-xl border px-3 text-center ${
              isDark
                ? "border-white/15 bg-white text-neutral-900"
                : "border-slate-200 bg-slate-50 text-slate-900"
            }`}
          />
        </View>
      ) : null}

      {value.kind === "two_legged" ? (
        <Pressable
          onPress={() =>
            onChange({
              kind: "two_legged",
              awayGoals: !(value.awayGoals ?? false),
            })
          }
          className={`flex-row items-center justify-between gap-3 rounded-xl border px-3 py-3 ${
            isDark ? "border-white/15 bg-white/5" : "border-slate-200 bg-slate-50"
          }`}
        >
          <Text
            className={isDark ? "text-sm text-white/80" : "text-sm text-slate-800"}
            numberOfLines={1}
          >
            Away goals tiebreak
          </Text>
          <Text
            className={
              value.awayGoals
                ? isDark
                  ? "text-accent-300"
                  : "text-brand-700"
                : isDark
                  ? "text-white/45"
                  : "text-slate-400"
            }
          >
            {value.awayGoals ? "On" : "Off"}
          </Text>
        </Pressable>
      ) : null}

      <Pressable
        onPress={() => onHasThirdPlaceChange(!hasThirdPlace)}
        className={`flex-row items-center justify-between gap-3 rounded-xl border px-3 py-3 ${
          isDark ? "border-white/15 bg-white/5" : "border-slate-200 bg-slate-50"
        }`}
      >
        <Text
          className={isDark ? "text-sm text-white/80" : "text-sm text-slate-800"}
          numberOfLines={1}
        >
          Third-place playoff
        </Text>
        <Text
          className={
            hasThirdPlace
              ? isDark
                ? "text-accent-300"
                : "text-brand-700"
              : isDark
                ? "text-white/45"
                : "text-slate-400"
          }
        >
          {hasThirdPlace ? "On" : "Off"}
        </Text>
      </Pressable>
    </View>
  );
}

export function tieFormatFromConfig(
  config: KnockoutStageConfig | Record<string, unknown> | undefined,
): TieFormatSelection {
  const ties = (config as KnockoutStageConfig | undefined)?.ties?.default;
  if (!ties) return { kind: "single" };
  const format = ties.tie_format as TieFormat | undefined;
  if (format === "two_legged") {
    return { kind: "two_legged", awayGoals: ties.away_goals ?? false };
  }
  if (format === "best_of") {
    return { kind: "best_of", bestOf: ties.best_of ?? 3 };
  }
  return { kind: "single" };
}
