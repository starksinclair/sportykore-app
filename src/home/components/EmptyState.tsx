import { Text, View } from "react-native";

import { useTheme } from "@/color/use-theme";

type Props = {
  title: string;
  body: string;
};

export function EmptyState({ title, body }: Props) {
  const theme = useTheme();

  return (
    <View
      className="rounded-[24px] border border-dashed px-5 py-7"
      style={{
        backgroundColor: theme.cardMuted,
        borderColor: theme.cardBorder,
      }}
    >
      <Text
        className="text-base"
        style={{ color: theme.text }}
      >
        {title}
      </Text>
      <Text
        className="pt-2 text-sm leading-6"
        style={{ color: theme.textMuted }}
      >
        {body}
      </Text>
    </View>
  );
}
