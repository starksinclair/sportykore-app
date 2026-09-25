import { ActivityIndicator, View } from "react-native";

import { useAuth } from "@/auth";
import { useOwnCoachProfile } from "@/coach";
import {
  CoachProfileCreateState,
  CoachProfileView,
} from "@/coach/components/CoachProfileSurface";
import { NotFound } from "@/components/not-found";
import { DetailScreenShell } from "@/components/ui/detail-screen-shell";
import { colors } from "@/constants";
import { messageForResourceLoad } from "@/lib/show-error-toast";
import { useTrackView } from "@/lib/use-track-view";

export default function OwnCoachProfileRoute() {
  const { user } = useAuth();
  const ownQuery = useOwnCoachProfile(Boolean(user));
  const result = ownQuery.data;
  const coach = result?.kind === "profile" ? result.coach : null;

  useTrackView(
    "coach_viewed",
    coach ? coach.id : null,
    coach
      ? {
          coach_id: coach.id,
          coach_name: coach.displayName,
          is_owner: true,
        }
      : undefined,
  );

  if (ownQuery.isLoading && !result) {
    return (
      <DetailScreenShell title="Coach profile" tabletMaxWidth={1040}>
        <View className="items-center py-20">
          <ActivityIndicator color={colors.accent} />
        </View>
      </DetailScreenShell>
    );
  }

  if (ownQuery.isError) {
    return (
      <DetailScreenShell title="Coach profile" tabletMaxWidth={1040}>
        <NotFound
          message={messageForResourceLoad(ownQuery.error, "Coach profile")}
        />
      </DetailScreenShell>
    );
  }

  if (!result || result.kind === "missing") {
    return (
      <DetailScreenShell title="Coach profile" tabletMaxWidth={1040}>
        <CoachProfileCreateState viewerName={user?.name} />
      </DetailScreenShell>
    );
  }

  return (
    <DetailScreenShell
      title={coach?.displayName ?? "Coach profile"}
      subtitle="Your coach profile"
      tabletMaxWidth={1040}
    >
      <CoachProfileView coach={result.coach} isOwner viewerName={user?.name} />
    </DetailScreenShell>
  );
}
