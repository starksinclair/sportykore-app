import { Pressable, Text, View } from "react-native";

export function ErrorState({ onRetry, message }: { onRetry?: () => void, message?: string }) {
    return (
      <View className="items-center gap-4 py-10">
        <Text
          className="text-sm text-neutral-500"
        >
            {message ||  "Something went wrong. Check your connection and try again."}
        </Text>
        <Pressable
          onPress={onRetry}
          className="rounded-2xl bg-brand-800 px-6 py-3 active:bg-brand-900"
        >
          <Text className="text-sm text-white">
            Retry
          </Text>
        </Pressable>
      </View>
    );
  }
