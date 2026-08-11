import { apiRequest } from "@/api/http-client";

import type {
  BugReportInput,
  BugReportResponse,
  HelpCenterResponse,
} from "./types";

export function fetchHelpCenterFaqs() {
  return apiRequest<{ data: HelpCenterResponse }>("/api/v1/support/faqs").then(
    (response) => response.data,
  );
}

export function submitBugReport(input: BugReportInput) {
  return apiRequest<BugReportResponse>("/api/v1/support/bug-reports", {
    method: "POST",
    auth: "optional",
    muteGlobalUnauthorized: true,
    idempotencyKey: true,
    jsonBody: input,
  });
}
