import { useEffect, useState } from "react";
import { Pressable, Share, Text, View } from "react-native";
import QRCode from "react-native-qrcode-svg";

import type { ApiTeam } from "@/api/entities";
import { Button } from "@/components/ui/Button";
import { BlackPatternBackground } from "@/components/ui/black-pattern-background";
import { BottomSheetModal } from "@/components/ui/bottom-sheet-modal";
import { scoreboardPattern } from "@/constants";
import { copyToClipboard } from "@/lib/copy-to-clipboard";
import { showInfoToast, showThrownAsToast } from "@/lib/show-error-toast";
import { fonts } from "@/theme/fonts";

import { buildInviteUrl, useGenerateInvite } from "@/invite";

type Props = {
  visible: boolean;
  onClose: () => void;
  leagueId: number;
  leagueName: string;
  seasonId: number;
  teams: ApiTeam[];
  initialTeamId: number | null;
};

export function InviteLinkSheet({
  visible,
  onClose,
  leagueId,
  leagueName,
  seasonId,
  teams,
  initialTeamId,
}: Props) {
  const generateInvite = useGenerateInvite();
  const [teamId, setTeamId] = useState<number | null>(initialTeamId);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setTeamId(initialTeamId);
    setInviteUrl(null);
  }, [visible, initialTeamId]);

  const activeTeam = teams.find((team) => team.id === teamId) ?? null;

  const handleClose = () => {
    setInviteUrl(null);
    onClose();
  };

  const handleGenerate = async () => {
    if (teamId == null) return;
    try {
      const result = await generateInvite.mutateAsync({
        leagueId,
        seasonId,
        teamId,
      });
      setInviteUrl(
        buildInviteUrl(result.inviteLink, {
          leagueName,
          teamName: activeTeam?.name,
        }),
      );
    } catch (error) {
      showThrownAsToast(error, "Could not generate invite");
    }
  };

  const handleCopy = async () => {
    if (!inviteUrl) return;
    const result = await copyToClipboard(inviteUrl);
    if (result === "clipboard") {
      showInfoToast("Copied", "Invite link copied to clipboard.");
    }
  };

  const handleShare = async () => {
    if (!inviteUrl) return;
    try {
      const teamLabel = activeTeam?.name ?? "your team";
      await Share.share({
        message: `Join ${teamLabel} in ${leagueName} on SportyKore:\n${inviteUrl}`,
      });
    } catch {
      // User dismissed share sheet.
    }
  };

  return (
    <BottomSheetModal
      visible={visible}
      onClose={handleClose}
      variant="dark"
      title="Invite to team"
      subtitle={
        inviteUrl
          ? "Share this link so players know which league and team they are joining."
          : "Pick a team, then generate an invite link."
      }
    >
      <View className="gap-5">
        {!inviteUrl ? (
          <>
            <InviteContextCard leagueName={leagueName} teamName={activeTeam?.name} />
            <TeamPicker teams={teams} selectedId={teamId} onSelect={setTeamId} />
            <Button
              variant="authPurple"
              label="Generate invite link"
              onPress={() => void handleGenerate()}
              loading={generateInvite.isPending}
              disabled={teamId == null || generateInvite.isPending}
            />
          </>
        ) : (
          <View className="gap-5">
            <InviteContextCard leagueName={leagueName} teamName={activeTeam?.name} />

            <View className="overflow-hidden rounded-2xl border border-white/10">
              <BlackPatternBackground
                baseColor={scoreboardPattern().baseColor}
                stripeColor={scoreboardPattern().stripeColor}
              />
              <View className="items-center px-4 py-5">
                <View className="rounded-2xl bg-white p-4">
                  <QRCode value={inviteUrl} size={200} color="#1C1C1E" backgroundColor="#FFFFFF" />
                </View>
              </View>
            </View>

            <Text
              style={{ fontFamily: fonts.body }}
              className="w-full rounded-xl border border-white/10 bg-white/6 px-3 py-3 text-center text-xs leading-5 text-white/75"
              selectable
            >
              {inviteUrl}
            </Text>

            <View className="w-full flex-row gap-3">
              <Button
                variant="secondary"
                label="Copy link"
                onPress={() => void handleCopy()}
                className="flex-1"
              />
              <Button
                variant="signInYellow"
                label="Share"
                onPress={() => void handleShare()}
                className="flex-1"
              />
            </View>

            <Button
              variant="secondary"
              label="Generate new link"
              onPress={() => setInviteUrl(null)}
              className="w-full border-white/10 bg-white/6"
            />
          </View>
        )}
      </View>
    </BottomSheetModal>
  );
}

function InviteContextCard({
  leagueName,
  teamName,
}: {
  leagueName: string;
  teamName?: string;
}) {
  return (
    <View className="gap-3 rounded-2xl border border-white/10 bg-white/6 px-4 py-4">
      <ContextRow label="League" value={leagueName} />
      {teamName ? <ContextRow label="Team" value={teamName} /> : null}
    </View>
  );
}

function ContextRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="gap-1">
      <Text
        style={{ fontFamily: fonts.bodyBold }}
        className="text-[11px] uppercase tracking-wider text-white/45"
      >
        {label}
      </Text>
      <Text style={{ fontFamily: fonts.bodyBold }} className="text-base text-white">
        {value}
      </Text>
    </View>
  );
}

function TeamPicker({
  teams,
  selectedId,
  onSelect,
}: {
  teams: ApiTeam[];
  selectedId: number | null;
  onSelect: (id: number) => void;
}) {
  return (
    <View className="gap-2">
      <Text
        style={{ fontFamily: fonts.bodyBold }}
        className="text-[11px] uppercase tracking-wider text-white/45"
      >
        Team
      </Text>
      <View className="flex-row flex-wrap gap-2">
        {teams.map((team) => {
          const active = selectedId === team.id;
          return (
            <Pressable
              key={team.id}
              onPress={() => onSelect(team.id)}
              className={[
                "rounded-full border px-4 py-2",
                active
                  ? "border-accent-500 bg-accent-500/15"
                  : "border-white/10 bg-white/6",
              ].join(" ")}
            >
              <Text
                style={{ fontFamily: fonts.bodySemibold }}
                className={active ? "text-accent-400" : "text-white/75"}
              >
                {team.name}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
