import type {
  ApiStage,
  ApiTie,
  BracketRound,
  CompetitionFormat,
  KnockoutStageConfig,
} from "@/api/entities";
import { apiRequest } from "@/api/http-client";

export type StageBracket = {
  stage: ApiStage;
  ties: ApiTie[];
};

export type CreateKnockoutStagePayload = {
  seasonId: number;
  name: string;
  sequence?: number;
  config: KnockoutStageConfig;
};

export type CreateKnockoutStageResult = {
  message: string;
  id: number;
};

export async function fetchSeasonStages(seasonId: number): Promise<ApiStage[]> {
  return apiRequest<{ data: ApiStage[] }>(
    `/api/v1/seasons/${seasonId}/stages`,
  ).then((r) => r.data);
}

export async function fetchStageBracket(stageId: number): Promise<StageBracket> {
  return apiRequest<{ data: StageBracket }>(
    `/api/v1/leagues/stages/${stageId}/bracket`,
  ).then((r) => r.data);
}

export async function createKnockoutStage(
  leagueId: number,
  payload: CreateKnockoutStagePayload,
): Promise<CreateKnockoutStageResult> {
  return apiRequest<CreateKnockoutStageResult>(
    `/api/v1/leagues/${leagueId}/stages`,
    {
      method: "POST",
      auth: true,
      idempotencyKey: true,
      jsonBody: payload,
    },
  );
}

export async function seedKnockoutStage(
  stageId: number,
  seededTeams: number[],
): Promise<void> {
  await apiRequest<{ message: string }>(
    `/api/v1/leagues/stages/${stageId}/seed`,
    {
      method: "POST",
      auth: true,
      idempotencyKey: true,
      jsonBody: { seededTeams },
    },
  );
}

export async function generateNextRound(
  stageId: number,
  completedRound: BracketRound,
): Promise<void> {
  await apiRequest<{ message: string }>(
    `/api/v1/leagues/stages/${stageId}/next-round`,
    {
      method: "POST",
      auth: true,
      idempotencyKey: true,
      jsonBody: { completedRound },
    },
  );
}

export async function enterPenaltyShootout(gameId: number): Promise<void> {
  await apiRequest<{ message: string }>(
    `/api/v1/games/${gameId}/penalty-shootout`,
    { method: "POST", auth: true, idempotencyKey: true },
  );
}

export async function completePenaltyShootout(
  gameId: number,
  homePenaltyScore: number,
  awayPenaltyScore: number,
): Promise<void> {
  await apiRequest<{ message: string }>(
    `/api/v1/games/${gameId}/penalty-shootout/complete`,
    {
      method: "POST",
      auth: true,
      idempotencyKey: true,
      jsonBody: { homePenaltyScore, awayPenaltyScore },
    },
  );
}

export type { CompetitionFormat, KnockoutStageConfig };
