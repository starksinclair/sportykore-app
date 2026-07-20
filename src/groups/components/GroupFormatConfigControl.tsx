import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";

import { AuthTextField } from "@/components/ui/auth-text-field";
import { FormFieldLabel } from "@/components/ui/form-field-label";
import { fonts } from "@/theme/fonts";

/**
 * Numeric field that keeps a local text draft so the user can clear it or
 * retype freely; only valid values (1..max) are committed to the form, and
 * blur restores the last committed value when the draft is empty/invalid.
 */
function NumberField({
  label,
  value,
  max,
  onCommit,
}: {
  label: string;
  value: number;
  max: number;
  onCommit: (n: number) => void;
}) {
  const [text, setText] = useState(String(value));

  useEffect(() => {
    setText(String(value));
  }, [value]);

  return (
    <AuthTextField
      label={label}
      value={text}
      keyboardType="number-pad"
      onChangeText={(raw) => {
        const digits = raw.replace(/[^0-9]/g, "");
        if (!digits || Number(digits) < 1) {
          setText(digits);
          return;
        }
        const clamped = Math.min(Number(digits), max);
        setText(String(clamped));
        onCommit(clamped);
      }}
      onBlur={() => {
        if (!text || Number(text) < 1) setText(String(value));
      }}
    />
  );
}

export type GroupFormatFormState = {
  groupCount: number;
  doubleRoundRobin: boolean;
  perGroup: number;
};

type Props = {
  value: GroupFormatFormState;
  onChange: (value: GroupFormatFormState) => void;
  tone?: "light" | "dark";
};

export function GroupFormatConfigControl({
  value,
  onChange,
  tone = "light",
}: Props) {
  const labelClass =
    tone === "dark" ? "text-white/45" : "text-slate-500";
  const chipIdle =
    tone === "dark"
      ? "border-white/15 bg-white/5"
      : "border-neutral-200 bg-[#F5F5F5]";
  const chipActive =
    tone === "dark"
      ? "border-accent-400 bg-accent-500/20"
      : "border-brand-400 bg-brand-50";
  const chipTextIdle = tone === "dark" ? "text-white/70" : "text-neutral-700";
  const chipTextActive = tone === "dark" ? "text-accent-200" : "text-brand-800";

  return (
    <View className="gap-3">
      <NumberField
        label="Number of groups"
        value={value.groupCount}
        max={16}
        onCommit={(n) => onChange({ ...value, groupCount: n })}
      />

      <View className="gap-1.5">
        <FormFieldLabel label="Round robin" className={labelClass} />
        <View className="flex-row flex-wrap gap-2">
          {(
            [
              { id: false, label: "Single" },
              { id: true, label: "Home & away" },
            ] as const
          ).map((opt) => {
            const active = value.doubleRoundRobin === opt.id;
            return (
              <Pressable
                key={String(opt.id)}
                onPress={() =>
                  onChange({ ...value, doubleRoundRobin: opt.id })
                }
                className={`rounded-xl border px-3 py-2 ${
                  active ? chipActive : chipIdle
                }`}
              >
                <Text
                  style={{ fontFamily: fonts.bodySemibold }}
                  className={active ? chipTextActive : chipTextIdle}
                >
                  {opt.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <NumberField
        label="Teams advancing per group"
        value={value.perGroup}
        max={8}
        onCommit={(n) => onChange({ ...value, perGroup: n })}
      />

      <Text
        style={{ fontFamily: fonts.body }}
        className={`text-xs leading-5 ${
          tone === "dark" ? "text-white/45" : "text-slate-500"
        }`}
      >
        Scoring is fixed at 3/1/0. Standings sort by points, then goal difference,
        goals for, then name.
      </Text>
    </View>
  );
}
