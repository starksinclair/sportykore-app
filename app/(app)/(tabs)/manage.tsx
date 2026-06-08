import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "@/auth";
import { BlackPatternBackground } from "@/components/ui/black-pattern-background";
import { ErrorState } from "@/components/ui/error-state";
import { Logo } from "@/components/ui/logo";
import { colors, scoreboardPattern } from "@/constants";
import {
  ManageLeagueRow,
  ManageLoginPrompt,
  promptBiometricGate,
  useOwnedLeagues,
} from "@/manage";
import { fonts } from "@/theme/fonts";
import useRefresh from "hooks/useRefresh";

export default function ManageScreen() {
  const router = useRouter();
  const { user, hydrated } = useAuth();
  const query = useOwnedLeagues(Boolean(user));
  const [refreshing, onRefresh] = useRefresh([() => query.refetch()]);

  const handleOpenLeague = async (leagueId: number) => {
    const allowed = await promptBiometricGate();
    if (!allowed) return;
    router.push(`/manage/${leagueId}`);
  };

  return (
    <View className="flex-1 bg-[#121212]">
      <StatusBar style="light" />
      <SafeAreaView className="flex-1" edges={["top"]}>
        <BlackPatternBackground
          baseColor={scoreboardPattern().baseColor}
          stripeColor={scoreboardPattern().stripeColor}
        />

        <View className="px-5 pb-4 pt-2">
          <View className="mx-auto w-full max-w-[760px]">
            <Logo variant="full" color={colors.accent} fontSize={28} lineHeight={38} />
            <Text
              style={{ fontFamily: fonts.bodyBold }}
              className="pt-3 text-[26px] text-white"
            >
              Manage
            </Text>
            <Text
              style={{ fontFamily: fonts.body }}
              className="pt-1 text-sm text-white/60"
            >
              Leagues you own — schedule games, run live scores, and manage
              rosters.
            </Text>
          </View>
        </View>

        {!hydrated ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color={colors.accent} />
          </View>
        ) : !user ? (
          <ManageLoginPrompt />
        ) : query.isLoading && !query.data ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color={colors.accent} />
          </View>
        ) : query.isError ? (
          <View className="flex-1 px-5">
            <View className="mx-auto w-full max-w-[760px]">
              <ErrorState onRetry={() => query.refetch()} />
            </View>
          </View>
        ) : (
          <ScrollView
            className="flex-1"
            contentContainerClassName="px-5 pb-10"
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.accent}
              />
            }
            showsVerticalScrollIndicator={false}
          >
            <View className="mx-auto w-full max-w-[760px] gap-3">
              {!query.data?.length ? (
                <View className="items-center rounded-[24px] border border-white/10 bg-white/5 px-6 py-10">
                  <Text
                    style={{ fontFamily: fonts.bodyBold }}
                    className="text-center text-lg text-white"
                  >
                    No leagues yet
                  </Text>
                  <Text
                    style={{ fontFamily: fonts.body }}
                    className="pt-2 text-center text-sm leading-6 text-white/55"
                  >
                    Create a league from the Create tab, then return here to run
                    match day operations.
                  </Text>
                </View>
              ) : (
                query.data.map((league) => (
                  <ManageLeagueRow
                    key={league.id}
                    league={league}
                    onPress={() => handleOpenLeague(league.id)}
                  />
                ))
              )}
            </View>
          </ScrollView>
        )}
      </SafeAreaView>
    </View>
  );
}
