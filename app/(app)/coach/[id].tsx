import { useLocalSearchParams } from "expo-router";
import { ActivityIndicator, View } from "react-native";

import { useCoachProfile } from "@/coach";
import { CoachProfileView } from "@/coach/components/CoachProfileSurface";
import { NotFound } from "@/components/not-found";
import { DetailScreenShell } from "@/components/ui/detail-screen-shell";
import { colors } from "@/constants";
import { messageForResourceLoad } from "@/lib/show-error-toast";
import { useTrackView } from "@/lib/use-track-view";

export default function CoachRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const coachId = Number(id);
  const isValidId = Number.isFinite(coachId) && coachId > 0;
  const query = useCoachProfile(isValidId ? coachId : 0);
  const coach = query.data ?? null;

  useTrackView(
    "coach_viewed",
    coach ? coach.id : null,
    coach
      ? {
          coach_id: coach.id,
          coach_name: coach.displayName,
          is_owner: false,
        }
      : undefined,
  );

  if (!isValidId) {
    return (
      <DetailScreenShell title="Coach" tabletMaxWidth={1040}>
        <NotFound message="Invalid coach id" />
      </DetailScreenShell>
    );
  }

  if (query.isLoading && !coach) {
    return (
      <DetailScreenShell title="Coach" tabletMaxWidth={1040}>
        <View className="items-center py-20">
          <ActivityIndicator color={colors.accent} />
        </View>
      </DetailScreenShell>
    );
  }

  if (query.isError || !coach) {
    return (
      <DetailScreenShell title="Coach" tabletMaxWidth={1040}>
        <NotFound message={messageForResourceLoad(query.error, "Coach")} />
      </DetailScreenShell>
    );
  }

  return (
    <DetailScreenShell title={coach.displayName} subtitle="Coach profile" tabletMaxWidth={1040}>
      <CoachProfileView coach={coach} />
    </DetailScreenShell>
  );
}
