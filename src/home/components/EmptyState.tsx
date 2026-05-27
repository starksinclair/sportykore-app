import { Text, View } from "react-native";

import { fonts } from "@/theme/fonts";

type Props = {
  title: string;
  body: string;
};

export function EmptyState({ title, body }: Props) {
  return (
    <View className="rounded-[24px] border border-dashed border-neutral-300 bg-neutral-50 px-5 py-7">
      <Text
        style={{ fontFamily: fonts.bodyBold }}
        className="text-base text-neutral-950"
      >
        {title}
      </Text>
      <Text
        style={{ fontFamily: fonts.body }}
        className="pt-2 text-sm leading-6 text-slate-600"
      >
        {body}
      </Text>
    </View>
  );
}
