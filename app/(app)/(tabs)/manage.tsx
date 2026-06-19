import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
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
            <ErrorState onRetry={() => query.refetch()} />
          </View>
        ) : (
          <FlatList
            className="flex-1 px-5"
            data={query.data ?? []}
            keyExtractor={(league) => String(league.id)}
            renderItem={({ item: league }) => (
              <ManageLeagueRow
                league={league}
                onPress={() => handleOpenLeague(league.id)}
              />
            )}
            ItemSeparatorComponent={() => <View className="h-3" />}
            ListEmptyComponent={ManageEmptyLeagues}
            contentContainerClassName="pb-[10rem] grow"
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.accent}
              />
            }
            showsVerticalScrollIndicator={false}
          />
        )}
      </SafeAreaView>
    </View>
  );
}

function ManageEmptyLeagues() {
  return (
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
        Create a league from the Create tab, then return here to run match day
        operations.
      </Text>
    </View>
  );
}
