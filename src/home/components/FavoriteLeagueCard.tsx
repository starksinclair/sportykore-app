import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { useAuthGate } from "@/auth";
import { CountryLabel } from "@/components/ui/CountryFlag";
import { EntityLogo } from "@/components/ui";
import { colors } from "@/constants";
import { fonts } from "@/theme/fonts";

import { useFavouriteLeague, useUnfavouriteLeague } from "../hooks/useLeaguesByCountry";
import type { FavoriteLeagueEntry } from "../partitionMatchesFeed";
import type { FetchLeaguesParams } from "../types";
import { MatchRow } from "./MatchRow";

type Props = {
  entry: FavoriteLeagueEntry;
  params: FetchLeaguesParams;
};

export function FavoriteLeagueCard({ entry, params }: Props) {
  const router = useRouter();
  const { league, country } = entry;
  const { mutate: favouriteLeague } = useFavouriteLeague(params);
  const { mutate: unfavouriteLeague } = useUnfavouriteLeague(params);
  const { requireAuth } = useAuthGate();

  return (
    <View
      className="overflow-hidden rounded-[13px] border border-neutral-200 bg-white"
      style={styles.card}
    >
      <View className="flex-row items-center justify-between gap-3 bg-white px-4 py-3">
        <EntityLogo
          logoUrl={league.logoUrl}
          variant="league"
          size="sm"
          tone="accent"
          accessibilityLabel={`${league.name} logo`}
        />
        <View className="min-w-0 flex-1">
          <TouchableOpacity onPress={() => router.push(`/league/${league.id}`)}>
            <Text
              style={{ fontFamily: fonts.bodyBold }}
              className="text-[13px] text-neutral-950"
              numberOfLines={1}
            >
              {league.name}
            </Text>
          </TouchableOpacity>
          <CountryLabel
            code={country.code}
            name={country.name}
            flagWidth={14}
            textClassName="text-[9px] text-neutral-500"
          />
        </View>
        <Pressable
          onPress={() =>
            requireAuth({ action: "favourite this league" }, () => {
              if (league.isFavourited) {
                unfavouriteLeague(league.id);
              } else {
                favouriteLeague(league.id);
              }
            })
          }
        >
          <Ionicons
            name={league.isFavourited ? "heart" : "heart-outline"}
            size={19}
            color={league.isFavourited ? colors.brand : "#6B7280"}
          />
        </Pressable>
      </View>

      {(league.games ?? []).length > 0 ? (
        <View className="border-t border-neutral-200">
          {(league.games ?? []).map((game, index) => (
            <View
              key={game.id}
              className={
                index !== (league.games ?? []).length - 1
                  ? "border-b border-neutral-200"
                  : ""
              }
            >
              <MatchRow game={game} />
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    shadowColor: colors.scoreboardBlack,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 4,
  },
});
