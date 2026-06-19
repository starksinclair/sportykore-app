import { DetailTabs } from "@/components/ui/detail-tabs";

export type TeamSide = "home" | "away";

type Props = {
  homeLabel: string;
  awayLabel: string;
  activeSide: TeamSide;
  onSideChange: (side: TeamSide) => void;
};

export function TeamTabs({
  homeLabel,
  awayLabel,
  activeSide,
  onSideChange,
}: Props) {
  const tabs = [
    { key: "home" as const, label: homeLabel },
    { key: "away" as const, label: awayLabel },
  ];

  return (
    <DetailTabs
      tabs={tabs}
      activeTab={activeSide}
      onTabChange={onSideChange}
      scrollable
    />
  );
}
