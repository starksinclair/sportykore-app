import { useNetworkStatus } from "hooks/useNetworkStatus";
import { Text, View } from "react-native";

export function OfflineBanner() {
  const { isOnline } = useNetworkStatus();

  if (isOnline) return null;

  return (
    <View className="items-center bg-amber-500 px-3 py-1.5">
      <Text className="text-xs font-medium text-white">
        You&apos;re offline — showing saved data
      </Text>
    </View>
  );
}
