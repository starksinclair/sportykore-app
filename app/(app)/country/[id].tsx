import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

import { useTheme } from "@/color/use-theme";
import { DetailTabs, EntityLogo, type DetailTab } from "@/components/ui";
import { DetailScreenShell } from "@/components/ui/detail-screen-shell";
import { colors } from "@/constants";
import type { CountryMatchSummary, CountryPlayerHighlight } from "@/country";
import { useCountryDetail } from "@/country";
import type { TeamRef } from "@/home/types";
import { messageForResourceLoad } from "@/lib/show-error-toast";

type TabKey = "teams" | "players" | "recentMatches";

const TABS: readonly DetailTab<TabKey>[] = [
  { key: "teams", label: "Teams" },
  { key: "players", label: "Players to watch" },
  { key: "recentMatches", label: "Recent matches" },
];

export default function CountryRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState<TabKey>("teams");
  const query = useCountryDetail(id ?? "");

  if (query.isLoading) {
    return (
      <DetailScreenShell title="Country" tabletMaxWidth={1040}>
        <View className="items-center py-20">
          <ActivityIndicator color={colors.accent} />
        </View>
      </DetailScreenShell>
    );
  }

  if (query.isError || !query.data) {
    return (
      <DetailScreenShell title="Country" tabletMaxWidth={1040}>
        <View
          className="rounded-[22px] border px-5 py-8"
          style={{
            backgroundColor: theme.card,
            borderColor: theme.cardBorder,
          }}
        >
          <Text className="text-lg" style={{ color: theme.text }}>
            {query.isError
              ? messageForResourceLoad(query.error, "Country")
              : "Country not found."}
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
      tabletMaxWidth={1040}
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
            className="text-[12px] uppercase tracking-[2px]"
            style={{ color: theme.textSubtle }}
          >
            Leagues
          </Text>
          <View className="gap-2">
            {leagues.map((league) => (
              <Pressable
                key={league.id}
                onPress={() => router.push(`/league/${league.id}`)}
                className="flex-row items-center justify-between rounded-[18px] px-4 py-3 active:opacity-85"
                style={{ backgroundColor: theme.card }}
              >
                <View className="flex-row items-center gap-3">
                  <EntityLogo
                    logoUrl={league.logoUrl}
                    variant="league"
                    size="sm"
                    tone="brand"
                  />
                  <Text style={{ color: theme.text }}>
                    {league.name}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={theme.textSubtle} />
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
  const theme = useTheme();

  if (!teams.length) {
    return <EmptyTab message="No teams in this country yet." />;
  }

  return (
    <View className="gap-3">
      {teams.map((team) => (
        <Pressable
          key={team.id}
          onPress={() => router.push(`/team/${team.id}`)}
          className="flex-row items-center justify-between rounded-[18px] px-4 py-4 active:opacity-85"
          style={{ backgroundColor: theme.card }}
        >
          <View className="flex-row items-center gap-3">
            <EntityLogo
              logoUrl={team.logoUrl}
              variant="team"
              size="sm"
              tone="dark"
            />
            <Text style={{ color: theme.text }}>
              {team.name}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={theme.textSubtle} />
        </Pressable>
      ))}
    </View>
  );
}

function PlayersTab({ players }: { players: CountryPlayerHighlight[] }) {
  const router = useRouter();
  const theme = useTheme();

  if (!players.length) {
    return <EmptyTab message="No featured players for this country yet." />;
  }

  return (
    <View className="gap-3">
      {players.map((entry) => (
        <Pressable
          key={entry.player.id}
          onPress={() => router.push(`/player/${entry.player.id}`)}
          className="flex-row items-center justify-between rounded-[22px] px-4 py-4 active:opacity-85"
          style={{ backgroundColor: theme.card }}
        >
          <View className="flex-row items-center gap-3">
            <View
              className="h-12 w-12 items-center justify-center rounded-full"
              style={{ backgroundColor: theme.brand }}
            >
              <Text className="text-base" style={{ color: theme.textInverse }}>
                {entry.player.avatarInitials}
              </Text>
            </View>
            <View>
              <Text style={{ color: theme.text }}>
                {entry.player.name}
              </Text>
              <Text className="text-sm" style={{ color: theme.textSubtle }}>
                {entry.player.position}
                {entry.goals > 0 ? ` · ${entry.goals} goals` : ""}
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color={theme.textSubtle} />
        </Pressable>
      ))}
    </View>
  );
}

function RecentMatchesTab({ matches }: { matches: CountryMatchSummary[] }) {
  const router = useRouter();
  const theme = useTheme();

  if (!matches.length) {
    return <EmptyTab message="No recent matches for this country yet." />;
  }

  return (
    <View className="gap-3">
      {matches.map((match) => (
        <Pressable
          key={match.id}
          onPress={() => router.push(`/match/${match.id}`)}
          className="rounded-[22px] px-4 py-4 active:opacity-85"
          style={{ backgroundColor: theme.card }}
        >
          <Text style={{ color: theme.text }}>
            {match.homeTeam.name} {match.scoreline} {match.awayTeam.name}
          </Text>
          <Text className="pt-2 text-sm" style={{ color: theme.textSubtle }}>
            {match.kickoffLabel} · {match.venue}
          </Text>
          {match.league?.name ? (
            <Text className="pt-1 text-xs" style={{ color: theme.textSubtle }}>
              {match.league.name}
            </Text>
          ) : null}
        </Pressable>
      ))}
    </View>
  );
}

function EmptyTab({ message }: { message: string }) {
  const theme = useTheme();

  return (
    <Text className="text-sm" style={{ color: theme.textSubtle }}>
      {message}
    </Text>
  );
}

function StatRow({
  items,
}: {
  items: { label: string; value: number }[];
}) {
  const theme = useTheme();

  return (
    <View className="flex-row gap-3">
      {items.map((item) => (
        <View
          key={item.label}
          className="flex-1 rounded-[22px] border px-3 py-4"
          style={{
            backgroundColor: theme.card,
            borderColor: theme.cardBorder,
          }}
        >
          <Text
            className="text-center text-[24px]"
            style={{ color: theme.accent }}
          >
            {item.value}
          </Text>
          <Text
            className="pt-1 text-center text-xs"
            style={{ color: theme.textSubtle }}
          >
            {item.label}
          </Text>
        </View>
      ))}
    </View>
  );
}
