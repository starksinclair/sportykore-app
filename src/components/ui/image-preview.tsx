import { Image } from "expo-image";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { Modal, Pressable, Text, useWindowDimensions, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

type ImagePreviewState = {
  uri: string;
  label?: string;
};

type ImagePreviewContextValue = {
  openImagePreview: (uri: string, label?: string) => void;
};

const ImagePreviewContext = createContext<ImagePreviewContextValue | null>(null);

export function ImagePreviewProvider({ children }: { children: ReactNode }) {
  const { width, height } = useWindowDimensions();
  const [preview, setPreview] = useState<ImagePreviewState | null>(null);

  const openImagePreview = useCallback((uri: string, label?: string) => {
    const trimmed = uri.trim();
    if (!trimmed) return;
    setPreview({ uri: trimmed, label });
  }, []);

  const value = useMemo(
    () => ({ openImagePreview }),
    [openImagePreview],
  );

  const close = () => setPreview(null);
  const imageWidth = Math.max(280, width - 32);
  const imageHeight = Math.max(260, height * 0.72);

  return (
    <ImagePreviewContext.Provider value={value}>
      {children}
      <Modal
        visible={Boolean(preview)}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={close}
      >
        {/* RN's Modal renders into its own native root view, so the outer
            SafeAreaProvider's cached insets don't reliably reach it — nest a
            fresh provider here so SafeAreaView measures the modal's own
            window and the header/close button clear the status bar. */}
        <SafeAreaProvider>
          <View className="flex-1 bg-black/95">
            <Pressable
              className="absolute inset-0"
              onPress={close}
              accessibilityRole="button"
              accessibilityLabel="Close image preview"
            />
            <SafeAreaView className="flex-1 px-4 py-4">
              <View className="flex-row items-center justify-between gap-3">
                <View className="min-w-0 flex-1">
                  {preview?.label ? (
                    <Text className="text-base text-white" numberOfLines={1}>
                      {preview.label}
                    </Text>
                  ) : null}
                </View>
                <Pressable
                  onPress={close}
                  accessibilityRole="button"
                  accessibilityLabel="Close image preview"
                  className="h-11 w-11 items-center justify-center rounded-full"
                  style={{ backgroundColor: "rgba(255,255,255,0.12)" }}
                >
                  <Ionicons name="close" size={22} color="#FFFFFF" />
                </Pressable>
              </View>

              <View className="flex-1 items-center justify-center">
                {preview ? (
                  <Image
                    source={{ uri: preview.uri }}
                    style={{
                      width: imageWidth,
                      height: imageHeight,
                      maxWidth: "100%",
                    }}
                    contentFit="contain"
                    cachePolicy="memory-disk"
                    allowDownscaling
                  />
                ) : null}
              </View>
            </SafeAreaView>
          </View>
        </SafeAreaProvider>
      </Modal>
    </ImagePreviewContext.Provider>
  );
}

export function useImagePreview() {
  const context = useContext(ImagePreviewContext);
  return (
    context ?? {
      openImagePreview: () => undefined,
    }
  );
}
