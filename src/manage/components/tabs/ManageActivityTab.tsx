import { useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

import { Button } from "@/components/ui/Button";
import { colors } from "@/constants";
import { useAuditLogs } from "@/groups";
import { messageForResourceLoad } from "@/lib/show-error-toast";

type Props = {
  leagueId: number;
};

export function ManageActivityTab({ leagueId }: Props) {
  const [page, setPage] = useState(1);
  const query = useAuditLogs(leagueId, page, true);
  const rows = query.data?.data ?? [];
  const meta = query.data?.meta;
  const lastPage = meta?.lastPage ?? 1;

  if (query.isLoading && !query.data) {
    return (
      <View className="items-center py-16">
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  if (query.isError) {
    return (
      <Text className="text-sm text-white/55">
        {messageForResourceLoad(query.error, "Activity")}
      </Text>
    );
  }

  return (
    <View className="gap-4 pb-10">
      <Text className="text-lg text-white">
        Activity
      </Text>
      <Text className="text-sm text-white/55">
        Read-only log of organizer actions - deductions, overrides, draws, and more.
      </Text>

      {rows.length === 0 ? (
        <Text className="text-sm text-white/45">
          No activity yet.
        </Text>
      ) : (
        <View className="gap-2">
          {rows.map((entry) => {
            const reason =
              typeof entry.metadata?.reason === "string"
                ? entry.metadata.reason
                : typeof entry.metadata?.summary === "string"
                  ? entry.metadata.summary
                  : null;
            return (
              <View
                key={entry.id}
                className="rounded-[18px] border border-white/10 bg-white/5 px-4 py-3"
              >
                <Text
                  className="text-sm text-white"
                >
                  {entry.action}
                  {entry.targetLabel ? ` · ${entry.targetLabel}` : ""}
                </Text>
                <Text
                  className="pt-1 text-xs text-white/50"
                >
                  {entry.actorName ?? "Organizer"}
                  {" · "}
                  {formatWhen(entry.createdAt)}
                </Text>
                {reason ? (
                  <Text
                    className="pt-2 text-sm text-white/70"
                  >
                    {reason}
                  </Text>
                ) : null}
              </View>
            );
          })}
        </View>
      )}

      {lastPage > 1 ? (
        <View className="flex-row items-center justify-between gap-3">
          <Button
            variant="secondary"
            label="Previous"
            disabled={page <= 1}
            className="flex-1"
            onPress={() => setPage((p) => Math.max(1, p - 1))}
          />
          <Text className="text-sm text-white/50">
            {page} / {lastPage}
          </Text>
          <Button
            variant="secondary"
            label="Next"
            disabled={page >= lastPage}
            className="flex-1"
            onPress={() => setPage((p) => p + 1)}
          />
        </View>
      ) : null}

      {query.isFetching ? (
        <Pressable disabled>
          <Text className="text-center text-xs text-white/35">
            Refreshing…
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function formatWhen(iso: string): string {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}
