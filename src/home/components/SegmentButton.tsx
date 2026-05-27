import { fonts } from "@/theme/fonts";
import { Pressable, Text } from "react-native";

export function SegmentButton({
    active,
    label,
    onPress,
  }: {
    active: boolean;
    label: string;
    onPress: () => void;
  }) {
    return (
      <Pressable
        onPress={onPress}
        className={[
          "flex-1 rounded-[13px] px-4 py-3",
          active ? "bg-[#4A148C]" : "bg-transparent",
        ].join(" ")}
      >
        <Text
          style={{ fontFamily: active ? fonts.bodyBold : fonts.bodySemibold }}
          className={
            active ? "text-center text-sm text-white" : "text-center text-sm text-slate-600"
          }
        >
          {label}
        </Text>
      </Pressable>
    );
  }
  