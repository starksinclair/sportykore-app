import { useMutation, useQuery } from "@tanstack/react-query";

import { fetchHelpCenterFaqs, submitBugReport } from "./api";

export const supportKeys = {
  faqs: ["support", "faqs"] as const,
};

export function useHelpCenterFaqs() {
  return useQuery({
    queryKey: supportKeys.faqs,
    queryFn: fetchHelpCenterFaqs,
    staleTime: 30 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
  });
}

export function useSubmitBugReport() {
  return useMutation({
    mutationFn: submitBugReport,
  });
}
