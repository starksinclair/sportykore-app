export type SocialPlatform =
  | "instagram"
  | "tiktok"
  | "x"
  | "facebook"
  | "youtube"
  | "other";

export const SOCIAL_PLATFORM_OPTIONS: readonly {
  value: SocialPlatform;
  label: string;
}[] = [
  { value: "instagram", label: "Instagram" },
  { value: "tiktok", label: "TikTok" },
  { value: "x", label: "X (Twitter)" },
  { value: "facebook", label: "Facebook" },
  { value: "youtube", label: "YouTube" },
  { value: "other", label: "Other" },
];

const MAX_SOCIAL_HANDLE_LENGTH = 120;

const LEGACY_PREFIXES: readonly {
  platform: SocialPlatform;
  pattern: RegExp;
}[] = [
  { platform: "instagram", pattern: /^instagram\s*:\s*/i },
  { platform: "tiktok", pattern: /^tiktok\s*:\s*/i },
  { platform: "x", pattern: /^(?:x(?:\s*\(twitter\))?|twitter)\s*:\s*/i },
  { platform: "facebook", pattern: /^facebook\s*:\s*/i },
  { platform: "youtube", pattern: /^youtube\s*:\s*/i },
];

export function socialPlatformLabel(platform: SocialPlatform): string {
  return SOCIAL_PLATFORM_OPTIONS.find((option) => option.value === platform)?.label ?? "Social";
}

export function parseSocialProfile(value?: string | null): {
  platform: SocialPlatform;
  handle: string;
} {
  const trimmed = value?.trim() ?? "";
  for (const prefix of LEGACY_PREFIXES) {
    if (prefix.pattern.test(trimmed)) {
      return {
        platform: prefix.platform,
        handle: trimmed.replace(prefix.pattern, "").trim(),
      };
    }
  }
  return { platform: "other", handle: trimmed };
}

export function formatSocialProfile(
  platform: SocialPlatform,
  handle: string,
): string | null {
  const trimmed = handle.trim();
  if (!trimmed) return null;
  if (platform === "other") return trimmed.slice(0, MAX_SOCIAL_HANDLE_LENGTH);

  const prefix = `${socialPlatformLabel(platform)}: `;
  return `${prefix}${trimmed.slice(0, MAX_SOCIAL_HANDLE_LENGTH - prefix.length)}`;
}
