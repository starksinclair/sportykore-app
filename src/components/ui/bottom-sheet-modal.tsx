import { Ionicons } from "@expo/vector-icons";
import { type ReactNode } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { fonts } from "@/theme/fonts";

type BottomSheetModalProps = {
  visible: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
};

export function BottomSheetModal({
  visible,
  onClose,
  title,
  subtitle,
  children,
}: BottomSheetModalProps) {
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
          <View style={styles.sheet}>
            <View style={styles.handle} />
            <View style={styles.header}>
              <View style={styles.headerCopy}>
                <Text style={[styles.title, { fontFamily: fonts.bodyBold }]}>
                  {title}
                </Text>
                {subtitle ? (
                  <Text style={[styles.subtitle, { fontFamily: fonts.body }]}>
                    {subtitle}
                  </Text>
                ) : null}
              </View>
              <Pressable
                onPress={onClose}
                accessibilityRole="button"
                accessibilityLabel="Close modal"
                style={styles.closeButton}
              >
                <Ionicons name="close" size={20} color="#111827" />
              </Pressable>
            </View>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.content}
            >
              {children}
            </ScrollView>
          </View>
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
  sheet: {
    maxHeight: "72%",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
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
    gap: 16,
    marginBottom: 12,
  },
  headerCopy: {
    flex: 1,
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
    height: 40,
    width: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    backgroundColor: "#F3F4F6",
  },
  content: {
    paddingBottom: 18,
    gap: 10,
  },
});
