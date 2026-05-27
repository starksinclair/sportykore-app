import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

import { DetailTabs, type DetailTab } from "@/components/ui";
import { DetailScreenShell } from "@/components/ui/detail-screen-shell";
import { colors } from "@/constants";
import type { CountryMatchSummary, CountryPlayerHighlight } from "@/country";
import { useCountryDetail } from "@/country";
import type { TeamRef } from "@/home/types";
import { fonts } from "@/theme/fonts";

type TabKey = "teams" | "players" | "recentMatches";

const TABS: readonly DetailTab<TabKey>[] = [
  { key: "teams", label: "Teams" },
  { key: "players", label: "Players to watch" },
  { key: "recentMatches", label: "Recent matches" },
];

export default function CountryRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabKey>("teams");
  const query = useCountryDetail(id ?? "");

  if (query.isLoading) {
    return (
      <DetailScreenShell title="Country">
        <View className="items-center py-20">
          <ActivityIndicator color={colors.accent} />
        </View>
      </DetailScreenShell>
    );
  }

  if (query.isError || !query.data) {
    return (
      <DetailScreenShell title="Country">
        <View className="rounded-[22px] border border-white/10 bg-white/5 px-5 py-8">
          <Text style={{ fontFamily: fonts.bodyBold }} className="text-lg text-white">
            Country not found
          </Text>
        </View>
      </DetailScreenShell>
    );
  }

  const { country, stats, leagues, teams, featuredPlayers, recentMatches } =
    query.data;

  return (
    <DetailScreenShell
      title={country.name}
      subtitle="Country overview"
      headerContent={
        <DetailTabs
          tabs={TABS}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          scrollable
        />
      }
    >
    
      <StatRow
        items={[
          { label: "Leagues", value: stats.leagues },
          { label: "Teams", value: stats.teams },
          { label: "Players", value: stats.players },
          { label: "Live", value: stats.liveMatches },
        ]}
      />

      {leagues.length > 0 ? (
        <View className="gap-3">
          <Text
            style={{ fontFamily: fonts.bodyBold }}
            className="text-[12px] uppercase tracking-[2px] text-white/55"
          >
            Leagues
          </Text>
          <View className="gap-2">
            {leagues.map((league) => (
              <Pressable
                key={league.id}
                onPress={() => router.push(`/league/${league.id}`)}
                className="flex-row items-center justify-between rounded-[18px] bg-white/6 px-4 py-3 active:bg-white/10"
              >
                <View className="flex-row items-center gap-3">
                  <View className="h-10 w-10 items-center justify-center rounded-2xl bg-[#4A148C]">
                    <Ionicons name="trophy-outline" size={16} color="#FFFFFF" />
                  </View>
                  <Text style={{ fontFamily: fonts.bodyBold }} className="text-white">
                    {league.name}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#FFFFFF" />
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}

      {activeTab === "teams" ? (
        <TeamsTab teams={teams} />
      ) : null}
      {activeTab === "players" ? (
        <PlayersTab players={featuredPlayers} />
      ) : null}
      {activeTab === "recentMatches" ? (
        <RecentMatchesTab matches={recentMatches} />
      ) : null}
    </DetailScreenShell>
  );
}

function TeamsTab({ teams }: { teams: TeamRef[] }) {
  const router = useRouter();

  if (!teams.length) {
    return <EmptyTab message="No teams in this country yet." />;
  }

  return (
    <View className="gap-3">
      {teams.map((team) => (
        <Pressable
          key={team.id}
          onPress={() => router.push(`/team/${team.id}`)}
          className="flex-row items-center justify-between rounded-[18px] bg-white/6 px-4 py-4 active:bg-white/10"
        >
          <Text style={{ fontFamily: fonts.bodyBold }} className="text-white">
            {team.name}
          </Text>
          <Ionicons name="chevron-forward" size={18} color="#FFFFFF" />
        </Pressable>
      ))}
    </View>
  );
}

function PlayersTab({ players }: { players: CountryPlayerHighlight[] }) {
  const router = useRouter();

  if (!players.length) {
    return <EmptyTab message="No featured players for this country yet." />;
  }

  return (
    <View className="gap-3">
      {players.map((entry) => (
        <Pressable
          key={entry.player.id}
          onPress={() => router.push(`/player/${entry.player.id}`)}
          className="flex-row items-center justify-between rounded-[22px] bg-white/6 px-4 py-4 active:bg-white/10"
        >
          <View className="flex-row items-center gap-3">
            <View className="h-12 w-12 items-center justify-center rounded-full bg-[#364156]">
              <Text style={{ fontFamily: fonts.bodyBold }} className="text-base text-white">
                {entry.player.avatarInitials}
              </Text>
            </View>
            <View>
              <Text style={{ fontFamily: fonts.bodyBold }} className="text-white">
                {entry.player.name}
              </Text>
              <Text style={{ fontFamily: fonts.body }} className="text-sm text-white/55">
                {entry.player.position}
                {entry.goals > 0 ? ` · ${entry.goals} goals` : ""}
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#FFFFFF" />
        </Pressable>
      ))}
    </View>
  );
}

function RecentMatchesTab({ matches }: { matches: CountryMatchSummary[] }) {
  const router = useRouter();

  if (!matches.length) {
    return <EmptyTab message="No recent matches for this country yet." />;
  }

  return (
    <View className="gap-3">
      {matches.map((match) => (
        <Pressable
          key={match.id}
          onPress={() => router.push(`/match/${match.id}`)}
          className="rounded-[22px] bg-white/6 px-4 py-4 active:bg-white/10"
        >
          <Text style={{ fontFamily: fonts.bodyBold }} className="text-white">
            {match.homeTeam.name} {match.scoreline} {match.awayTeam.name}
          </Text>
          <Text style={{ fontFamily: fonts.body }} className="pt-2 text-sm text-white/55">
            {match.kickoffLabel} · {match.venue}
          </Text>
          {match.league?.name ? (
            <Text style={{ fontFamily: fonts.body }} className="pt-1 text-xs text-white/40">
              {match.league.name}
            </Text>
          ) : null}
        </Pressable>
      ))}
    </View>
  );
}

function EmptyTab({ message }: { message: string }) {
  return (
    <Text style={{ fontFamily: fonts.body }} className="text-sm text-white/55">
      {message}
    </Text>
  );
}

function StatRow({
  items,
}: {
  items: { label: string; value: number }[];
}) {
  return (
    <View className="flex-row gap-3">
      {items.map((item) => (
        <View key={item.label} className="flex-1 rounded-[22px] bg-white/6 px-3 py-4">
          <Text
            style={{ fontFamily: fonts.bodyBold }}
            className="text-center text-[24px] text-[#E6A817]"
          >
            {item.value}
          </Text>
          <Text
            style={{ fontFamily: fonts.body }}
            className="pt-1 text-center text-xs text-white/55"
          >
            {item.label}
          </Text>
        </View>
      ))}
    </View>
  );
}
