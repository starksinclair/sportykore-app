import type { Href } from "expo-router";
import type { ComponentProps } from "react";

import { Ionicons } from "@expo/vector-icons";

export type HelpCenterCategoryId =
  | "getting-started"
  | "player-profile"
  | "league-admin"
  | "team-manager"
  | "match-center"
  | "standings"
  | "invites"
  | "account";

export type HelpCenterCategory = {
  id: HelpCenterCategoryId;
  title: string;
  description: string;
  icon: ComponentProps<typeof Ionicons>["name"];
};

export type HelpCenterArticle = {
  id: string;
  categoryId: HelpCenterCategoryId;
  question: string;
  answer: string;
  tags: string[];
  relatedAction?: {
    label: string;
    route: Href;
  };
};

export const HELP_CENTER_META = {
  source: "local",
  version: "2026-08-launch",
  updatedAt: "2026-08-09",
} as const;

export const HELP_CENTER_CATEGORIES: HelpCenterCategory[] = [
  {
    id: "getting-started",
    title: "Getting started",
    description: "The basics for finding your way around SportyKore.",
    icon: "sparkles-outline",
  },
  {
    id: "player-profile",
    title: "Player profile",
    description: "Photo, bio, stats, highlights, and awards.",
    icon: "person-circle-outline",
  },
  {
    id: "league-admin",
    title: "League admin",
    description: "Create, schedule, invite, and run a league.",
    icon: "trophy-outline",
  },
  {
    id: "team-manager",
    title: "Team manager",
    description: "Set lineups for the team you manage.",
    icon: "shield-checkmark-outline",
  },
  {
    id: "match-center",
    title: "Match Center",
    description: "Live scoring, clock controls, substitutions, and MOTM.",
    icon: "football-outline",
  },
  {
    id: "standings",
    title: "Standings",
    description: "Tables, tie rules, groups, and promotion zones.",
    icon: "podium-outline",
  },
  {
    id: "invites",
    title: "Invites",
    description: "Join codes, team invites, and expiry rules.",
    icon: "ticket-outline",
  },
  {
    id: "account",
    title: "Account",
    description: "Sign in, security prompts, and account settings.",
    icon: "settings-outline",
  },
];

export const HELP_CENTER_ARTICLES: HelpCenterArticle[] = [
  {
    id: "what-is-sportykore",
    categoryId: "getting-started",
    question: "What is SportyKore for?",
    answer:
      "SportyKore helps grassroots leagues manage teams, fixtures, live scores, standings, player profiles, and match-day records in one place.",
    tags: ["basics", "overview", "leagues", "players"],
  },
  {
    id: "join-league",
    categoryId: "getting-started",
    question: "How do I join a league?",
    answer:
      "Open Join a league from Account settings, paste the code or link from your league admin, and follow the prompts. If you do not have a player profile yet, SportyKore will ask you to create one first.",
    tags: ["join", "code", "invite", "profile"],
    relatedAction: {
      label: "Join a league",
      route: "/join-league",
    },
  },
  {
    id: "create-player-profile",
    categoryId: "player-profile",
    question: "Why should I create a player profile?",
    answer:
      "Your player profile follows you across leagues. It keeps your bio, position, stats, highlights, and awards together so people can understand your football story quickly.",
    tags: ["profile", "stats", "highlights", "awards"],
    relatedAction: {
      label: "Open player profile",
      route: "/player/me",
    },
  },
  {
    id: "dob-privacy",
    categoryId: "player-profile",
    question: "Why does SportyKore ask for my date of birth?",
    answer:
      "It is used to show your age on your profile. The app does not show your date of birth back on the profile screen.",
    tags: ["dob", "age", "privacy", "profile"],
  },
  {
    id: "youtube-highlights",
    categoryId: "player-profile",
    question: "How do YouTube highlights work?",
    answer:
      "Paste a YouTube link in your profile. SportyKore checks the link, creates the thumbnail, and lets visitors play the highlight from your profile when supported on their device.",
    tags: ["youtube", "highlight", "video", "profile"],
  },
  {
    id: "private-profile",
    categoryId: "player-profile",
    question: "Why can I only see a small version of a profile?",
    answer:
      "Some profiles can be private. When that happens, SportyKore shows a respectful limited view instead of empty sections.",
    tags: ["private", "visibility", "profile"],
  },
  {
    id: "league-admin-role",
    categoryId: "league-admin",
    question: "What can a League admin do?",
    answer:
      "A League admin can manage teams, players, games, venues, standings, invites, knockout rounds, and match-day controls for the league.",
    tags: ["roles", "admin", "permissions", "league"],
  },
  {
    id: "league-setup-order",
    categoryId: "league-admin",
    question: "What should I set up first as a League admin?",
    answer:
      "Create teams, invite players, add venues, schedule games, then use Match Center on game day. After results are saved, review standings and tied cohorts.",
    tags: ["setup", "teams", "venues", "games", "standings"],
  },
  {
    id: "faceid-manage",
    categoryId: "account",
    question: "Why does Manage ask for Face ID or device unlock?",
    answer:
      "Manage includes league controls that can change teams, games, scores, and standings. Device unlock adds a quick local check before showing those controls.",
    tags: ["face id", "device unlock", "manage", "security"],
  },
  {
    id: "team-manager-role",
    categoryId: "team-manager",
    question: "What can a Team manager do?",
    answer:
      "A Team manager can set the lineup for their team. League-wide controls, score controls, and admin settings stay limited to League admins.",
    tags: ["roles", "team manager", "lineups", "permissions"],
  },
  {
    id: "set-lineup",
    categoryId: "team-manager",
    question: "How do I set a lineup?",
    answer:
      "Open the team from Manage, choose the match, then add starters and substitutes. On match day, the lineup also appears inside Match Center.",
    tags: ["lineup", "starters", "substitutes", "team"],
  },
  {
    id: "match-day-flow",
    categoryId: "match-center",
    question: "What is the Match Center flow?",
    answer:
      "Use lineups first, start the clock, log goals and match events as they happen, make substitutions from the lineup tab, choose man of the match, then end the game.",
    tags: ["match center", "clock", "goals", "motm", "substitutions"],
  },
  {
    id: "end-game",
    categoryId: "match-center",
    question: "What does End the game do?",
    answer:
      "End the game finishes the live match flow and saves the final state so the result can feed the league pages, player records, and standings.",
    tags: ["end game", "full time", "result", "match center"],
  },
  {
    id: "motm",
    categoryId: "match-center",
    question: "How do I choose man of the match?",
    answer:
      "Open Match Center, go to Lineup, and choose a player from the active starters or substitutes. One man of the match can be saved for each game.",
    tags: ["motm", "awards", "lineup", "player"],
  },
  {
    id: "standings-update",
    categoryId: "standings",
    question: "When do standings update?",
    answer:
      "Standings update from completed match results. If a table looks wrong, check that the match score was saved and that the game is in the right season or group.",
    tags: ["standings", "results", "games", "season"],
  },
  {
    id: "standings-zones",
    categoryId: "standings",
    question: "What are standing zones?",
    answer:
      "Standing zones mark positions such as promotion, qualification, or relegation. In grouped leagues, a range like 1 to 2 applies to positions 1 and 2 inside each group.",
    tags: ["zones", "promotion", "groups", "standings"],
  },
  {
    id: "tied-cohorts",
    categoryId: "standings",
    question: "What are tied cohorts?",
    answer:
      "Tied cohorts are teams that are level by the table rules. League admins can review them and apply the correct manual order when the rules require it.",
    tags: ["ties", "tiebreakers", "standings", "manual rank"],
  },
  {
    id: "invite-expiry",
    categoryId: "invites",
    question: "How long does an invite code last?",
    answer:
      "Team invite codes expire after 7 days. A code can be shared with more than one player until it expires.",
    tags: ["invite", "code", "expiry", "team"],
  },
  {
    id: "invite-profile-required",
    categoryId: "invites",
    question: "Why do I need a player profile before joining?",
    answer:
      "A league roster needs a player record to attach to your account. After your profile is created, SportyKore takes you back into the invite flow.",
    tags: ["invite", "profile", "roster", "join"],
  },
  {
    id: "missing-controls",
    categoryId: "account",
    question: "Why am I missing a button or admin control?",
    answer:
      "Controls are shown based on your role. If you expected admin access, ask the League admin to confirm your role for that league or team.",
    tags: ["roles", "permissions", "buttons", "controls"],
  },
];
