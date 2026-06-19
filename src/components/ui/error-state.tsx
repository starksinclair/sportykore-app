import { fonts } from "@/theme/fonts";
import { Pressable, Text, View } from "react-native";

export function ErrorState({ onRetry, message }: { onRetry?: () => void, message?: string }) {
    return (
      <View className="items-center gap-4 py-10">
        <Text
          style={{ fontFamily: fonts.bodySemibold }}
          className="text-sm text-neutral-500"
        >
            {message ||  "Something went wrong. Check your connection and try again."}
        </Text>
        <Pressable
          onPress={onRetry}
          className="rounded-2xl bg-[#4A148C] px-6 py-3 active:bg-[#3a0f6e]"
        >
          <Text style={{ fontFamily: fonts.bodyBold }} className="text-sm text-white">
            Retry
          </Text>
        </Pressable>
      </View>
    );
  }