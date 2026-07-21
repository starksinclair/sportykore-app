import { useLocalSearchParams } from "expo-router";
import { ActivityIndicator, View } from "react-native";

import { NotFound } from "@/components/not-found";
import { DetailScreenShell } from "@/components/ui/detail-screen-shell";
import { colors } from "@/constants";
import { usePlayerDetail } from "@/player";
import { PlayerProfileView } from "@/player/components/PlayerProfileSurface";

export default function PlayerRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const playerId = Number(id);
  const isValidId = Number.isFinite(playerId) && playerId > 0;
  const query = usePlayerDetail(isValidId ? playerId : 0);
  const detail = query.data ?? null;

  if (!isValidId) {
    return (
      <DetailScreenShell title="Player">
        <NotFound message="Invalid player id" />
      </DetailScreenShell>
    );
  }

  if (query.isLoading && !detail) {
    return (
      <DetailScreenShell title="Player">
        <View className="items-center py-20">
          <ActivityIndicator color={colors.accent} />
        </View>
      </DetailScreenShell>
    );
  }

  if (query.isError || !detail) {
    return (
      <DetailScreenShell title="Player">
        <NotFound message="Player not found" />
      </DetailScreenShell>
    );
  }

  return (
    <DetailScreenShell
      title={detail.player.name}
      subtitle={
        detail.player.visibility === "private" ? "Private profile" : undefined
      }
    >
      <PlayerProfileView
        player={detail.player}
        leagues={detail.leagues}
        statTypes={detail.statTypes}
        isOwner={false}
      />
    </DetailScreenShell>
  );
}
