import { Text, View } from "react-native";

type Props = {
  title: string;
  body: string;
};

export function EmptyState({ title, body }: Props) {
  return (
    <View className="rounded-[24px] border border-dashed border-neutral-300 bg-neutral-50 px-5 py-7">
      <Text
        className="text-base text-neutral-950"
      >
        {title}
      </Text>
      <Text
        className="pt-2 text-sm leading-6 text-slate-600"
      >
        {body}
      </Text>
    </View>
  );
}
