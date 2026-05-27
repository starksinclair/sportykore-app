import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";

import { useAuthGate } from "@/auth";
import { CountryFlag } from "@/components/ui/CountryFlag";
import { colors } from "@/constants";
import { fonts } from "@/theme/fonts";

import { useFavouriteLeague, useUnfavouriteLeague } from "../hooks/useLeaguesByCountry";
import type { ApiCountryWithLeagues, FetchLeaguesParams } from "../types";
import { MatchRow } from "./MatchRow";

type Props = {
  entry: ApiCountryWithLeagues;
  defaultOpen?: boolean;
  params: FetchLeaguesParams
};

export function CountryAccordion({ entry, defaultOpen = false, params }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(defaultOpen);
  const { mutate: favouriteLeague } = useFavouriteLeague(params);
  const { mutate: unfavouriteLeague } = useUnfavouriteLeague(params);
  const { requireAuth } = useAuthGate();
  console.log("entry isFavourited", entry.leagues[0].isFavourited);
  return (
    <View
      className="overflow-hidden rounded-[24px] border border-neutral-200 bg-white"
      style={styles.card}
    >
      <View
        className={[
          "flex-row items-center justify-between gap-3 bg-white px-4 py-4 active:bg-neutral-50",
          open ? "border-b border-neutral-200" : "",
        ].join(" ")}
      >
        <View className="flex-row items-center gap-3">
          <CountryFlag code={entry.code} width={28} />
          <Text
            style={{ fontFamily: fonts.bodyBold }}
            className="text-[16px] text-neutral-950"
          >
            {entry.name}
          </Text>
        </View>

       <Pressable onPress={() => setOpen((current) => !current)}>
       <Ionicons
          name={open ? "chevron-up" : "chevron-down"}
          size={18}
          color="#6B7280"
        />
       </Pressable>
      </View>

      {open ? (
        <Animated.View entering={FadeIn.duration(180)} className="bg-white px-3 pb-3 pt-1">
          {entry.leagues.map((league) => (
            <View key={league.id} className="mt-2 overflow-hidden rounded-[13px] border border-neutral-200">
              <View
                className="flex-row items-center justify-between gap-3 bg-white px-4 py-3 active:bg-neutral-50"
              >
               <TouchableOpacity onPress={() => router.push(`/league/${league.id}`)}>
               <Text
                  style={{ fontFamily: fonts.bodyBold }}
                  className="flex-1 text-[13px] text-neutral-950"
                  numberOfLines={1}
                >
                  {league.name}
                </Text>
               </TouchableOpacity>
               <Pressable
                 onPress={() =>
                   requireAuth({ action: "favourite this league" }, () => {
                    console.log("league.isFavourited", league.isFavourited);
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
          ))}
        </Animated.View>
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
