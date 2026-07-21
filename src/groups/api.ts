import type {
  ApiAdminAuditLog,
  ApiStage,
  ApiStageGroup,
  ApiStageStandings,
  ApiStandingAdjustment,
  ApiStandingOverride,
  ApiStandingZone,
  BracketRound,
  GroupStageConfig,
  KnockoutStageConfig,
  StandingZoneType,
} from "@/api/entities";
import { apiRequest } from "@/api/http-client";

export type AssignGroupTeamsPayload =
  | {
      mode: "manual";
      assignments: { teamId: number; stageGroupId: number }[];
    }
  | {
      mode: "auto";
      teamIds: number[];
      shuffle?: boolean;
    };

export type AssignGroupTeamsResult = {
  message: string;
  assignments: { teamId: number; stageGroupId: number }[];
};

export type CreateGroupStagePayload = {
  seasonId: number;
  name: string;
  stageType: "group";
  sequence?: number;
  config: GroupStageConfig;
};

export type CreateGroupStageResult = {
  message: string;
  id: number;
  groups?: ApiStageGroup[];
};

export type QualifierEntry = {
  teamId: number;
  team?: { id: number; name: string; logoUrl?: string | null };
  source?: string | null;
  groupName?: string | null;
  position?: number | null;
};

export type QualifierBracketOption = {
  targetRound: BracketRound;
  label?: string;
  qualifyCount: number;
  byeCount: number;
  thirdsNeeded: number;
  feasible: boolean;
  summary?: string;
};

export type ResolveQualifiersResult = {
  qualifiers: QualifierEntry[];
  proposedPairings?: { homeTeamId: number; awayTeamId: number }[] | null;
  thirdsNeeded?: number;
  thirdsCandidates?: QualifierEntry[];
  cutLine?: number | null;
  outstandingGames?: number;
  options?: QualifierBracketOption[];
  targetRound?: BracketRound | null;
  thirdsMode?: "auto" | "manual" | null;
};

export type FetchQualifiersQuery = {
  dryRun?: boolean;
  targetRound?: BracketRound;
  thirdsMode?: "auto" | "manual";
  selectedThirds?: number[];
  force?: boolean;
};

export type GenerateKnockoutFromGroupPayload = {
  targetRound?: BracketRound;
  thirdsMode?: "auto" | "manual";
  selectedThirds?: number[];
  qualifiers?: number[];
  force?: boolean;
  name?: string;
  config?: KnockoutStageConfig;
};

export type GenerateKnockoutFromGroupResult = {
  stage: ApiStage;
  ties: unknown[];
  qualifiers: QualifierEntry[] | number[];
};

export type CreateAdjustmentPayload = {
  teamId: number;
  pointsDelta: number;
  reason: string;
  stageGroupId?: number | null;
};

export type UpdateAdjustmentPayload = {
  pointsDelta?: number;
  reason?: string;
};

export type CreateOverridePayload = {
  stageGroupId?: number | null;
  reason: string;
  ranks: { teamId: number; manualRank: number }[];
};

export type CreateZonePayload = {
  zoneType: StandingZoneType;
  positionStart: number;
  positionEnd: number;
  label?: string | null;
  stageGroupId?: number | null;
};

export type UpdateZonePayload = {
  zoneType?: StandingZoneType;
  positionStart?: number;
  positionEnd?: number;
  label?: string | null;
  stageGroupId?: number | null;
};

type WireStandingZone = Omit<ApiStandingZone, "fromPosition" | "toPosition"> & {
  fromPosition?: number;
  toPosition?: number;
  positionStart?: number;
  positionEnd?: number;
};

export type PaginatedAuditLogs = {
  data: ApiAdminAuditLog[];
  meta: {
    total?: number;
    perPage?: number;
    currentPage?: number;
    lastPage?: number;
  };
};

export async function fetchStageStandings(
  stageId: number,
): Promise<ApiStageStandings> {
  return apiRequest<{ data: ApiStageStandings }>(
    `/api/v1/leagues/stages/${stageId}/standings`,
  ).then((r) => normalizeStandings(r.data));
}

/**
 * Older backends send flat teamId/teamName on stage-standings rows instead of
 * the nested team object the UI renders (rebuild it when missing), and used
 * to key the row's zone tag as `zoneType` instead of `type` - normalize both
 * so zone colors/legend render regardless of the deployed backend version.
 */
function normalizeStandings(data: ApiStageStandings): ApiStageStandings {
  for (const table of data?.tables ?? []) {
    for (const row of table.rows ?? []) {
      if (!row.team) {
        const raw = row as typeof row & { teamId?: number; teamName?: string };
        if (raw.teamId != null) {
          row.team = {
            id: raw.teamId,
            name: raw.teamName ?? `Team ${raw.teamId}`,
            logoUrl: null,
          };
        }
      }
      if (row.zone) {
        const rawZone = row.zone as typeof row.zone & { zoneType?: StandingZoneType };
        if (!rawZone.type && rawZone.zoneType) {
          row.zone = { type: rawZone.zoneType, label: rawZone.label };
        }
      }
    }
  }
  return data;
}

export async function createGroupStage(
  leagueId: number,
  payload: CreateGroupStagePayload,
): Promise<CreateGroupStageResult> {
  return apiRequest<CreateGroupStageResult>(
    `/api/v1/leagues/${leagueId}/stages`,
    { method: "POST", auth: true, jsonBody: payload },
  );
}

export async function assignGroupTeams(
  stageId: number,
  payload: AssignGroupTeamsPayload,
): Promise<AssignGroupTeamsResult> {
  return apiRequest<AssignGroupTeamsResult>(
    `/api/v1/leagues/stages/${stageId}/groups/assign`,
    { method: "POST", auth: true, jsonBody: payload },
  );
}

export async function generateGroupFixtures(
  stageId: number,
): Promise<{ message: string; count: number }> {
  return apiRequest<{ message: string; count: number }>(
    `/api/v1/leagues/stages/${stageId}/fixtures`,
    { method: "POST", auth: true },
  );
}

export async function fetchQualifiers(
  stageId: number,
  query: FetchQualifiersQuery = {},
): Promise<ResolveQualifiersResult> {
  const params = new URLSearchParams();
  if (query.dryRun != null) params.set("dryRun", String(query.dryRun));
  if (query.targetRound) params.set("targetRound", query.targetRound);
  if (query.thirdsMode) params.set("thirdsMode", query.thirdsMode);
  if (query.selectedThirds?.length) {
    params.set("selectedThirds", query.selectedThirds.join(","));
  }
  if (query.force != null) params.set("force", String(query.force));
  const qs = params.toString();
  return apiRequest<{ data: ResolveQualifiersResult }>(
    `/api/v1/leagues/stages/${stageId}/qualifiers${qs ? `?${qs}` : ""}`,
    { auth: true },
  ).then((r) => r.data);
}

export async function generateKnockoutFromGroup(
  stageId: number,
  payload: GenerateKnockoutFromGroupPayload,
): Promise<GenerateKnockoutFromGroupResult> {
  return apiRequest<GenerateKnockoutFromGroupResult>(
    `/api/v1/leagues/stages/${stageId}/generate-knockout`,
    { method: "POST", auth: true, jsonBody: payload },
  );
}

export async function fetchAdjustments(
  stageId: number,
): Promise<ApiStandingAdjustment[]> {
  return apiRequest<{ data: ApiStandingAdjustment[] }>(
    `/api/v1/leagues/stages/${stageId}/standings/adjustments`,
    { auth: true },
  ).then((r) => r.data);
}

export async function createAdjustment(
  stageId: number,
  payload: CreateAdjustmentPayload,
): Promise<ApiStandingAdjustment> {
  return apiRequest<ApiStandingAdjustment>(
    `/api/v1/leagues/stages/${stageId}/standings/adjustments`,
    { method: "POST", auth: true, jsonBody: payload },
  );
}

export async function updateAdjustment(
  adjustmentId: number,
  payload: UpdateAdjustmentPayload,
): Promise<ApiStandingAdjustment> {
  return apiRequest<ApiStandingAdjustment>(
    `/api/v1/leagues/stages/adjustments/${adjustmentId}`,
    { method: "PUT", auth: true, jsonBody: payload },
  );
}

export async function deleteAdjustment(adjustmentId: number): Promise<void> {
  await apiRequest<{ message: string }>(
    `/api/v1/leagues/stages/adjustments/${adjustmentId}`,
    { method: "DELETE", auth: true },
  );
}

export async function createStandingOverride(
  stageId: number,
  payload: CreateOverridePayload,
): Promise<{ overrides: ApiStandingOverride[] }> {
  return apiRequest<{ overrides: ApiStandingOverride[] }>(
    `/api/v1/leagues/stages/${stageId}/standings/overrides`,
    { method: "POST", auth: true, jsonBody: payload },
  );
}

export async function deleteStandingOverride(
  stageId: number,
  overrideId: number,
): Promise<void> {
  await apiRequest<{ message: string }>(
    `/api/v1/leagues/stages/${stageId}/standings/overrides/${overrideId}`,
    { method: "DELETE", auth: true },
  );
}

export async function fetchZones(stageId: number): Promise<ApiStandingZone[]> {
  return apiRequest<{ data: ApiStandingZone[] }>(
    `/api/v1/leagues/stages/${stageId}/zones`,
    { auth: true },
  ).then((r) => r.data.map(normalizeZone));
}

export async function createZone(
  stageId: number,
  payload: CreateZonePayload,
): Promise<ApiStandingZone> {
  return apiRequest<ApiStandingZone>(
    `/api/v1/leagues/stages/${stageId}/zones`,
    { method: "POST", auth: true, jsonBody: payload },
  ).then(normalizeZone);
}

export async function updateZone(
  zoneId: number,
  payload: UpdateZonePayload,
): Promise<ApiStandingZone> {
  return apiRequest<ApiStandingZone>(
    `/api/v1/leagues/stages/zones/${zoneId}`,
    { method: "PUT", auth: true, jsonBody: payload },
  ).then(normalizeZone);
}

function normalizeZone(zone: WireStandingZone): ApiStandingZone {
  return {
    ...zone,
    fromPosition: zone.fromPosition ?? zone.positionStart ?? 0,
    toPosition: zone.toPosition ?? zone.positionEnd ?? 0,
  };
}

export async function deleteZone(zoneId: number): Promise<void> {
  await apiRequest<{ message: string }>(
    `/api/v1/leagues/stages/zones/${zoneId}`,
    { method: "DELETE", auth: true },
  );
}

export async function fetchAuditLogs(
  leagueId: number,
  page = 1,
  perPage = 30,
): Promise<PaginatedAuditLogs> {
  const params = new URLSearchParams({
    page: String(page),
    perPage: String(perPage),
  });
  return apiRequest<{ data: PaginatedAuditLogs }>(
    `/api/v1/leagues/${leagueId}/audit-logs?${params}`,
    { auth: true },
  ).then((r) => r.data);
}
