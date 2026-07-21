import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type {
  ToastConfig,
  ToastConfigParams,
} from "react-native-toast-message";

import { fonts } from "@/theme/fonts";

type ToastTone = "success" | "error" | "info";

const toastMeta: Record<
  ToastTone,
  {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
  }
> = {
  success: {
    icon: "checkmark-circle",
    label: "Success",
  },
  error: {
    icon: "alert-circle",
    label: "Error",
  },
  info: {
    icon: "information-circle",
    label: "Info",
  },
};

const STRIPE_COUNT = 7;

function BrandedToast({
  tone,
  params,
}: {
  tone: ToastTone;
  params: ToastConfigParams<unknown>;
}) {
  const meta = toastMeta[tone];
  const title = params.text1?.trim() || meta.label;
  const body = params.text2?.trim();

  return (
    <Pressable
      onPress={params.onPress}
      accessibilityRole="alert"
      className="mx-4 overflow-hidden rounded-[22px] border border-neutral-950 bg-accent-500"
      style={styles.toast}
    >
      <View className="absolute bottom-0 left-0 top-0 w-3 overflow-hidden bg-neutral-950">
        {Array.from({ length: STRIPE_COUNT }).map((_, index) => (
          <View
            key={index}
            className={index % 2 === 0 ? "flex-1 bg-neutral-950" : "flex-1 bg-brand-700"}
          />
        ))}
      </View>
      <View className="flex-row items-start gap-3 px-4 py-3.5 pl-6">
        <View className="mt-0.5 h-9 w-9 items-center justify-center rounded-2xl bg-neutral-950">
          <Ionicons name={meta.icon} size={20} color="#E6A817" />
        </View>
        <View className="min-w-0 flex-1 gap-0.5">
          <Text
            style={[{ fontFamily: fonts.bodyBold }, params.text1Style]}
            className="text-sm text-neutral-950"
            numberOfLines={2}
          >
            {title}
          </Text>
          {body ? (
            <Text
              style={[{ fontFamily: fonts.body }, params.text2Style]}
              className="text-xs leading-5 text-neutral-950"
              numberOfLines={3}
            >
              {body}
            </Text>
          ) : null}
        </View>
        <Pressable
          onPress={() => params.hide(undefined)}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Dismiss notification"
          className="h-8 w-8 items-center justify-center rounded-xl bg-neutral-950 active:bg-brand-950"
        >
          <Ionicons name="close" size={16} color="#E6A817" />
        </Pressable>
      </View>
    </Pressable>
  );
}

export const sportyToastConfig: ToastConfig = {
  success: (params) => <BrandedToast tone="success" params={params} />,
  error: (params) => <BrandedToast tone="error" params={params} />,
  info: (params) => <BrandedToast tone="info" params={params} />,
};

const styles = StyleSheet.create({
  toast: {
    alignSelf: "center",
    width: "92%",
    maxWidth: 520,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.24,
    shadowRadius: 24,
    elevation: 10,
  },
});
