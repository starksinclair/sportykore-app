import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

import { FormFieldLabel } from "@/components/ui/form-field-label";
import { colors } from "@/constants";
import { pickProfileImage } from "@/lib/pick-profile-image";
import { MAX_IMAGE_UPLOAD_LABEL, type PickedImageFile } from "@/lib/picked-image";
import { showThrownAsToast } from "@/lib/show-error-toast";

type Size = "sm" | "md" | "lg";

const SIZE_PX: Record<Size, number> = {
  sm: 48,
  md: 72,
  lg: 112,
};

type Props = {
  value: PickedImageFile | null;
  onChange: (file: PickedImageFile | null) => void;
  label?: string;
  hint?: string;
  size?: Size;
  compact?: boolean;
  layout?: "row" | "centered";
  /** Override the default profile image picker (e.g. competition PNG-only). */
  onPick?: () => Promise<PickedImageFile | null>;
  accessibilityLabel?: string;
};

export function LogoImageUpload({
  value,
  onChange,
  label,
  hint = `JPG, PNG, or WebP · max ${MAX_IMAGE_UPLOAD_LABEL}`,
  size = "md",
  compact = false,
  layout = "row",
  onPick,
  accessibilityLabel,
}: Props) {
  const [picking, setPicking] = useState(false);
  const dimension = SIZE_PX[size];

  const handlePick = async () => {
    setPicking(true);
    try {
      const picked = await (onPick ?? pickProfileImage)();
      if (picked) onChange(picked);
    } catch (error) {
      showThrownAsToast(error, "Could not pick image");
    } finally {
      setPicking(false);
    }
  };

  const pickLabel = accessibilityLabel ?? (value ? "Change logo" : "Add logo");

  const picker = (
    <Pressable
      onPress={() => void handlePick()}
      disabled={picking}
      accessibilityRole="button"
      accessibilityLabel={pickLabel}
      onLongPress={value ? () => onChange(null) : undefined}
      className="items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-neutral-300 bg-neutral-50 active:opacity-80"
      style={{ width: dimension, height: dimension }}
    >
      {picking ? (
        <ActivityIndicator color={colors.brand} />
      ) : value ? (
        <Image
          source={{ uri: value.uri }}
          style={{ width: "100%", height: "100%" }}
          contentFit="cover"
        />
      ) : (
        <View className="items-center gap-0.5 px-1">
          <Ionicons
            name="image-outline"
            size={size === "sm" ? 18 : size === "md" ? 22 : 28}
            color={colors.brand}
          />
          {size !== "sm" ? (
            <Text
              className="text-[10px] text-slate-500"
            >
              Add logo
            </Text>
          ) : null}
        </View>
      )}
    </Pressable>
  );

  if (compact) {
    return picker;
  }

  const meta = value ? (
    <>
      <Text
        className={`text-sm text-neutral-900 ${layout === "centered" ? "text-center" : ""}`}
        numberOfLines={1}
      >
        {value.name}
      </Text>
      <Pressable
        onPress={() => onChange(null)}
        accessibilityRole="button"
        accessibilityLabel="Remove logo"
        hitSlop={8}
        className={layout === "centered" ? "items-center" : undefined}
      >
        <Text
          className="text-sm text-brand"
        >
          Remove
        </Text>
      </Pressable>
    </>
  ) : (
    <Text
      className={`text-xs leading-5 text-slate-500 ${layout === "centered" ? "text-center" : ""}`}
    >
      {hint}
    </Text>
  );

  if (layout === "centered") {
    return (
      <View className="items-center gap-3">
        {label ? <FormFieldLabel label={label} /> : null}
        {picker}
        <View className="w-full gap-1 px-2">{meta}</View>
      </View>
    );
  }

  return (
    <View className="gap-2">
      {label ? <FormFieldLabel label={label} /> : null}

      <View className="flex-row items-center gap-3">
        {picker}
        <View className="flex-1 gap-1">{meta}</View>
      </View>
    </View>
  );
}
