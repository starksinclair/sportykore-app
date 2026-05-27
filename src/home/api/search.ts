import { apiRequest } from "@/api/http-client";

import type { SearchParams, SearchResponse } from "../types";

export async function search(params: SearchParams): Promise<SearchResponse> {
  const trimmed = params.q.trim();
  if (!trimmed) {
    return { query: trimmed, results: [] };
  }

  const query = new URLSearchParams();
  query.set("q", trimmed);
  if (params.limit != null) {
    query.set("limit", String(params.limit));
  }

  const res = await apiRequest<{ data: SearchResponse }>(
    `/api/v1/search?${query.toString()}`,
  );
  return res.data;
}
