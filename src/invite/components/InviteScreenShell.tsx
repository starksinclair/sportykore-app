import { StatusBar } from "expo-status-bar";
import type { ReactNode } from "react";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAppearance } from "@/color/appearance-context";
import { useTheme } from "@/color/use-theme";
import { BlackPatternBackground } from "@/components/ui/black-pattern-background";
import { Logo } from "@/components/ui/logo";
import { colors, scoreboardPattern } from "@/constants";
import { useAdaptiveLayout } from "@/hooks/useAdaptiveLayout";

type Props = {
  title: string;
  subtitle?: string;
  leagueName?: string;
  teamName?: string;
  children?: ReactNode;
};

export function InviteScreenShell({
  title,
  subtitle,
  leagueName,
  teamName,
  children,
}: Props) {
  const { isTablet } = useAdaptiveLayout();
  const { isDark } = useAppearance();
  const theme = useTheme();
  const hasContext = Boolean(leagueName?.trim() || teamName?.trim());

  return (
    <View className="flex-1" style={{ backgroundColor: theme.background }}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <SafeAreaView className="flex-1" edges={["top", "bottom"]}>
        <BlackPatternBackground
          baseColor={isDark ? scoreboardPattern().baseColor : theme.patternBase}
          stripeColor={isDark ? scoreboardPattern().stripeColor : theme.patternStripe}
        />
        <View
          className="absolute inset-0"
          pointerEvents="none"
          style={{ backgroundColor: isDark ? theme.overlay : "rgba(255,255,255,0.74)" }}
        />

        <View
          className="relative w-full flex-1 justify-center gap-8 px-6"
          style={
            isTablet
              ? { alignSelf: "center", maxWidth: 620, width: "100%" }
              : undefined
          }
        >
          <View className="items-center gap-3">
            <Logo variant="full" color={colors.accent} fontSize={32} lineHeight={44} />
            <Text
              className="text-center text-2xl"
              style={{ color: theme.text }}
            >
              {title}
            </Text>
            {subtitle ? (
              <Text
                className="text-center text-sm leading-6"
                style={{ color: theme.textMuted }}
              >
                {subtitle}
              </Text>
            ) : null}
          </View>

          {hasContext ? (
            <View
              className="gap-3 rounded-[24px] border px-5 py-5"
              style={{
                backgroundColor: theme.card,
                borderColor: theme.cardBorder,
              }}
            >
              {leagueName?.trim() ? (
                <InviteContextRow label="League" value={leagueName.trim()} />
              ) : null}
              {teamName?.trim() ? (
                <InviteContextRow label="Team" value={teamName.trim()} />
              ) : null}
            </View>
          ) : null}

          {children}
        </View>
      </SafeAreaView>
    </View>
  );
}

function InviteContextRow({ label, value }: { label: string; value: string }) {
  const theme = useTheme();

  return (
    <View className="gap-1">
      <Text
        className="text-[11px] uppercase tracking-wider"
        style={{ color: theme.textSubtle }}
      >
        {label}
      </Text>
      <Text
        className="text-lg"
        style={{ color: theme.text }}
      >
        {value}
      </Text>
    </View>
  );
}
