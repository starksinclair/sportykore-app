import type { Href } from "expo-router";

export type HelpCenterArticleDto = {
  id: string;
  categoryId: string;
  question: string;
  answer: string;
  tags: string[];
  relatedAction?: {
    label: string;
    route: string;
  };
  sortOrder?: number;
};

export type HelpCenterResponse = {
  articles: HelpCenterArticleDto[];
};

export type BugReportType =
  | "bug"
  | "confusing_flow"
  | "feature_request"
  | "account_access"
  | "other";

export type BugReportInput = {
  type: BugReportType;
  title: string;
  description: string;
  expected?: string;
  email?: string;
  route?: string;
  appVersion?: string;
  platform?: string;
  osVersion?: string;
  deviceModel?: string;
};

export type BugReportResponse = {
  message: string;
  report: {
    id: string;
    createdAt?: string | null;
  };
};

export type HelpCenterRelatedAction = {
  label: string;
  route: Href;
};
