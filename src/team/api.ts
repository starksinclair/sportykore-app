import { apiRequest } from "@/api/http-client";

import type { TeamDetail } from "./types";

export async function fetchTeamDetail(teamId: number): Promise<TeamDetail> {
  console.log(`/api/v1/teams/${teamId}`);
  const res = await apiRequest<{ data: TeamDetail }>(`/api/v1/teams/${teamId}`);
  return res.data;
}
