import { GameStatus } from "@/api/entities";

export function phaseLabel(status: GameStatus, currentMinute: number): string {
  switch (status) {
    case "live":
      return `${currentMinute}'`;
    case "break":
      return "HT";
    case "completed":
      return "FT";
    case "postponed":
      return "PST";
    case "cancelled":
      return "CAN";
    case "scheduled":
      return "TBD";
    default:
      return "";
  }
}
