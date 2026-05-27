import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { useState } from "react";
import { Modal, Pressable, Text, View } from "react-native";

import { colors } from "@/constants";
import { fonts } from "@/theme/fonts";

export type SeasonOption = {
  id: number;
  name: string;
  status?: "inactive" | "active" | "completed";
};

type Props = {
  seasons: SeasonOption[];
  activeSeasonId: number | null;
  onSelect: (seasonId: number) => void;
  label?: string;
  disabled?: boolean;
};

/**
 * Season picker using a native wheel picker (iOS) / dialog (Android).
 * When only one season is known, behaves like a label.
 */
export function SeasonPicker({
  seasons,
  activeSeasonId,
  onSelect,
  label = "Season",
  disabled = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const active = seasons.find((season) => season.id === activeSeasonId) ?? null;
  const interactive = !disabled && seasons.length > 1;

  return (
    <View>
      <Pressable
        onPress={() => {
          if (interactive) setOpen(true);
        }}
        accessibilityRole="button"
        accessibilityLabel={`${label} picker`}
        className="flex-row items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 active:opacity-80"
        style={{ opacity: interactive ? 1 : 0.85 }}
      >
        <Text
          style={{ fontFamily: fonts.bodySemibold }}
          className="text-[15px] text-white"
        >
          {label}: {active?.name ?? "—"}
        </Text>
        {interactive ? (
          <Ionicons name="chevron-down" size={18} color="rgba(255,255,255,0.7)" />
        ) : null}
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="slide"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable
          style={{ flex: 1 }}
          onPress={() => setOpen(false)}
        />
        <View
          style={{
            backgroundColor: "#fff",
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            borderCurve: "continuous",
            paddingBottom: 34,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              paddingHorizontal: 16,
              paddingVertical: 12,
              borderBottomWidth: 1,
              borderBottomColor: "rgba(0,0,0,0.08)",
            }}
          >
            <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 15, color: "#1C1C1E" }}>
              {`Choose ${label.toLowerCase()}`}
            </Text>
            <Pressable
              onPress={() => setOpen(false)}
              hitSlop={12}
            >
              <Text style={{ fontFamily: fonts.bodySemibold, fontSize: 15, color: colors.brand }}>
                Done
              </Text>
            </Pressable>
          </View>

          <Picker
            selectedValue={activeSeasonId}
            onValueChange={(value) => {
              if (value !== null) onSelect(value as number);
            }}
          >
            {seasons.map((season) => (
              <Picker.Item
                key={season.id}
                label={season.name}
                value={season.id}
                
              />
            ))}
          </Picker>
        </View>
      </Modal>
    </View>
  );
}
