import {
  compactSocialLinks,
  socialPlatformIcon,
  socialPlatformLabel,
  socialPlatformPlaceholder,
  toEditableSocialLinks,
} from "../social-links";

describe("social links helpers", () => {
  it("keeps API links editable without legacy formatting", () => {
    expect(
      toEditableSocialLinks([
        { platform: "instagram", url: "https://www.instagram.com/sportykore" },
      ]),
    ).toEqual([
      { platform: "instagram", url: "https://www.instagram.com/sportykore" },
    ]);
  });

  it("trims empty links and keeps one link per platform", () => {
    expect(
      compactSocialLinks([
        { platform: "instagram", url: "  " },
        { platform: "youtube", url: " @sportykore " },
        { platform: "youtube", url: " https://youtube.com/@sportykore " },
      ]),
    ).toEqual([{ platform: "youtube", url: "https://youtube.com/@sportykore" }]);
  });

  it("uses readable labels, icons, and platform examples", () => {
    expect(socialPlatformLabel("x")).toBe("X");
    expect(socialPlatformIcon("youtube")).toBe("logo-youtube");
    expect(socialPlatformPlaceholder("website")).toContain("https://");
  });
});
