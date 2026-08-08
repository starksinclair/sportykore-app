
import { Text, View } from "react-native";

export function NotFound({ message }: { message: string }) {
    return (
      <View className="rounded-[22px] border border-white/10 bg-white/5 px-5 py-8">
        <Text className="text-lg text-white">
          {message}
        </Text>
      </View>
    );
  }