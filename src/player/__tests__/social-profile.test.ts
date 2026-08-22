import {
  formatSocialProfile,
  parseSocialProfile,
  socialPlatformLabel,
} from "../social-profile";

describe("social profile formatting", () => {
  it("stores an explicit platform in the existing socialHandle field", () => {
    expect(formatSocialProfile("x", "@sportykore")).toBe(
      "X (Twitter): @sportykore",
    );
  });

  it("round-trips platform-qualified values", () => {
    expect(parseSocialProfile("Instagram: @sportykore")).toEqual({
      platform: "instagram",
      handle: "@sportykore",
    });
  });

  it("recognizes legacy Twitter labels", () => {
    expect(parseSocialProfile("Twitter: @sportykore")).toEqual({
      platform: "x",
      handle: "@sportykore",
    });
  });

  it("keeps legacy unqualified handles editable as Other", () => {
    expect(parseSocialProfile("@sportykore")).toEqual({
      platform: "other",
      handle: "@sportykore",
    });
  });

  it("returns null for an empty handle and honors the API limit", () => {
    expect(formatSocialProfile("instagram", "   ")).toBeNull();
    expect(formatSocialProfile("youtube", "x".repeat(200))).toHaveLength(120);
  });

  it("uses a clear label for X", () => {
    expect(socialPlatformLabel("x")).toBe("X (Twitter)");
  });
});
