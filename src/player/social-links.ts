import type { ComponentProps } from "react";

import { Ionicons } from "@expo/vector-icons";

export type SocialPlatform =
  | "instagram"
  | "tiktok"
  | "youtube"
  | "x"
  | "facebook"
  | "website";

export const SOCIAL_PLATFORM_OPTIONS: readonly {
  value: SocialPlatform;
  label: string;
  icon: ComponentProps<typeof Ionicons>["name"];
  placeholder: string;
}[] = [
  {
    value: "instagram",
    label: "Instagram",
    icon: "logo-instagram",
    placeholder: "@yourhandle or instagram.com/yourhandle",
  },
  {
    value: "tiktok",
    label: "TikTok",
    icon: "musical-notes-outline",
    placeholder: "@yourhandle or tiktok.com/@yourhandle",
  },
  {
    value: "youtube",
    label: "YouTube",
    icon: "logo-youtube",
    placeholder: "@channel or youtube.com/@channel",
  },
  {
    value: "x",
    label: "X",
    icon: "logo-twitter",
    placeholder: "@yourhandle or x.com/yourhandle",
  },
  {
    value: "facebook",
    label: "Facebook",
    icon: "logo-facebook",
    placeholder: "facebook.com/yourpage",
  },
  {
    value: "website",
    label: "Website",
    icon: "globe-outline",
    placeholder: "https://yourwebsite.com",
  },
];

export type EditableSocialLink = {
  platform: SocialPlatform;
  url: string;
};

export function socialPlatformLabel(platform: SocialPlatform): string {
  return (
    SOCIAL_PLATFORM_OPTIONS.find((option) => option.value === platform)?.label ??
    "Link"
  );
}

export function socialPlatformIcon(
  platform: SocialPlatform,
): ComponentProps<typeof Ionicons>["name"] {
  return (
    SOCIAL_PLATFORM_OPTIONS.find((option) => option.value === platform)?.icon ??
    "link-outline"
  );
}

export function socialPlatformPlaceholder(platform: SocialPlatform): string {
  return (
    SOCIAL_PLATFORM_OPTIONS.find((option) => option.value === platform)
      ?.placeholder ?? "Paste a profile link"
  );
}

export function emptySocialLinks(): EditableSocialLink[] {
  return [];
}

export function toEditableSocialLinks(
  links?: { platform: SocialPlatform; url: string }[] | null,
): EditableSocialLink[] {
  return (links ?? []).map((link) => ({
    platform: link.platform,
    url: link.url,
  }));
}

export function compactSocialLinks(
  links: EditableSocialLink[],
): EditableSocialLink[] {
  const rows = new Map<SocialPlatform, EditableSocialLink>();
  for (const link of links) {
    const url = link.url.trim();
    if (!url) continue;
    rows.set(link.platform, { platform: link.platform, url });
  }
  return [...rows.values()];
}
