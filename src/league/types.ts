import type { ApiLeagueDetail } from "@/api/entities";

/** Wire format from `GET /api/v1/leagues/:leagueId?seasonId=…` is `ApiLeagueDetail`. */
export type LeagueDetail = ApiLeagueDetail;
