import { StatusBar } from "expo-status-bar";
import type { ReactNode } from "react";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BlackPatternBackground } from "@/components/ui/black-pattern-background";
import { Logo } from "@/components/ui/logo";
import { colors, scoreboardPattern } from "@/constants";
import { fonts } from "@/theme/fonts";

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
  const hasContext = Boolean(leagueName?.trim() || teamName?.trim());

  return (
    <View className="flex-1 bg-[#121212]">
      <StatusBar style="light" />
      <SafeAreaView className="flex-1" edges={["top", "bottom"]}>
        <BlackPatternBackground
          baseColor={scoreboardPattern().baseColor}
          stripeColor={scoreboardPattern().stripeColor}
        />

        <View className="flex-1 justify-center gap-8 px-6">
          <View className="items-center gap-3">
            <Logo variant="full" color={colors.accent} fontSize={32} lineHeight={44} />
            <Text
              style={{ fontFamily: fonts.bodyBold }}
              className="text-center text-2xl text-white"
            >
              {title}
            </Text>
            {subtitle ? (
              <Text
                style={{ fontFamily: fonts.body }}
                className="text-center text-sm leading-6 text-white/65"
              >
                {subtitle}
              </Text>
            ) : null}
          </View>

          {hasContext ? (
            <View className="gap-3 rounded-[24px] border border-white/10 bg-white/6 px-5 py-5">
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
  return (
    <View className="gap-1">
      <Text
        style={{ fontFamily: fonts.bodyBold }}
        className="text-[11px] uppercase tracking-wider text-white/45"
      >
        {label}
      </Text>
      <Text
        style={{ fontFamily: fonts.bodyBold }}
        className="text-lg text-white"
      >
        {value}
      </Text>
    </View>
  );
}
