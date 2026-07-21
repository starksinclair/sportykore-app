import { ActivityIndicator, View } from "react-native";

import { useAuth } from "@/auth";
import { NotFound } from "@/components/not-found";
import { DetailScreenShell } from "@/components/ui/detail-screen-shell";
import { colors } from "@/constants";
import { useOwnPlayerProfile, usePlayerDetail } from "@/player";
import {
  PlayerProfileCreateState,
  PlayerProfileView,
} from "@/player/components/PlayerProfileSurface";

export default function OwnPlayerProfileRoute() {
  const { user } = useAuth();
  const ownQuery = useOwnPlayerProfile(Boolean(user));
  const ownResult = ownQuery.data;
  const playerId =
    ownResult?.kind === "profile" ? ownResult.data.player.id : 0;
  const detailQuery = usePlayerDetail(playerId);
  const detail = detailQuery.data;

  if (ownQuery.isLoading && !ownResult) {
    return (
      <DetailScreenShell title="Player profile">
        <View className="items-center py-20">
          <ActivityIndicator color={colors.accent} />
        </View>
      </DetailScreenShell>
    );
  }

  if (ownQuery.isError) {
    return (
      <DetailScreenShell title="Player profile">
        <NotFound message="Could not load your player profile" />
      </DetailScreenShell>
    );
  }

  if (!ownResult || ownResult.kind === "missing") {
    return (
      <DetailScreenShell title="Player profile">
        <PlayerProfileCreateState viewerName={user?.name} />
      </DetailScreenShell>
    );
  }

  const player = detail?.player ?? ownResult.data.player;

  return (
    <DetailScreenShell title={player.name} subtitle="Your player profile">
      <PlayerProfileView
        player={player}
        leagues={detail?.leagues ?? []}
        statTypes={detail?.statTypes ?? []}
        isOwner
        completeness={ownResult.data.completeness}
        missingFields={ownResult.data.missingFields}
        membership={ownResult.data.membership}
        viewerName={user?.name}
      />
    </DetailScreenShell>
  );
}
