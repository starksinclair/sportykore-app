import { Ionicons } from "@expo/vector-icons";
import { type ReactNode } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type BottomSheetModalProps = {
  visible: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  variant?: "light" | "dark";
  /**
   * When false, children render in a plain View instead of ScrollView.
   * Use this when embedding a VirtualizedList (e.g. Places autocomplete).
   */
  scrollEnabled?: boolean;
};

export function BottomSheetModal({
  visible,
  onClose,
  title,
  subtitle,
  children,
  variant = "light",
  scrollEnabled = true,
}: BottomSheetModalProps) {
  const isDark = variant === "dark";
  return (
    <Modal
      transparent
      visible={visible}
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.root}>
        <Pressable style={styles.scrim} onPress={onClose} />
        <SafeAreaView edges={["bottom"]} style={styles.safeArea}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={styles.keyboardAvoiding}
          >
            <View style={[styles.sheet, isDark && styles.sheetDark]}>
              <View style={[styles.handle, isDark && styles.handleDark]} />
              <View style={styles.header}>
                <View style={styles.headerCopy}>
                  <Text
                    style={[
                      styles.title,
                      isDark && styles.titleDark,
                    ]}
                    numberOfLines={2}
                  >
                    {title}
                  </Text>
                  {subtitle ? (
                    <Text
                      style={[
                        styles.subtitle,
                        isDark && styles.subtitleDark,
                      ]}
                      numberOfLines={3}
                    >
                      {subtitle}
                    </Text>
                  ) : null}
                </View>
                <Pressable
                  onPress={onClose}
                  accessibilityRole="button"
                  accessibilityLabel="Close modal"
                  style={[styles.closeButton, isDark && styles.closeButtonDark]}
                >
                  <Ionicons name="close" size={20} color={isDark ? "#F9FAFB" : "#111827"} />
                </Pressable>
              </View>
              {scrollEnabled ? (
                <ScrollView
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                  keyboardDismissMode="interactive"
                  contentContainerStyle={styles.content}
                >
                  {children}
                </ScrollView>
              ) : (
                <View style={styles.content}>{children}</View>
              )}
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.28)",
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
  },
  safeArea: {
    justifyContent: "flex-end",
  },
  keyboardAvoiding: {
    width: "100%",
  },
  sheet: {
    maxHeight: "97%",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  handle: {
    alignSelf: "center",
    height: 5,
    width: 52,
    borderRadius: 999,
    backgroundColor: "#D1D5DB",
    marginBottom: 14,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 12,
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  title: {
    fontSize: 20,
    color: "#111827",
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: "#6B7280",
  },
  closeButton: {
    height: 36,
    width: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    backgroundColor: "#F3F4F6",
  },
  content: {
    paddingBottom: 18,
    gap: 10,
  },
  sheetDark: {
    backgroundColor: "#121212",
    borderTopWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  handleDark: {
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  titleDark: {
    color: "#FFFFFF",
  },
  subtitleDark: {
    color: "rgba(255,255,255,0.55)",
  },
  closeButtonDark: {
    backgroundColor: "rgba(255,255,255,0.08)",
  },
});
