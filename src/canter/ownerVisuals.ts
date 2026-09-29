import { OWNER_VEXED_MIN, OWNER_WARNING_MIN } from "./constants";
import type { MatchState, OwnerState } from "./types";

export interface OwnerGlow {
  color: string;
  opacity: number;
}

function glowForOwner(owner: OwnerState): OwnerGlow | null {
  if (owner.stage === "vexed") {
    const t = Math.min((owner.hits - OWNER_VEXED_MIN) / 10, 1);
    return { color: "#FF3B1F", opacity: 0.22 + t * 0.18 };
  }
  if (owner.stage === "warning") {
    const t = (owner.hits - OWNER_WARNING_MIN) / 2;
    return { color: "#F2C230", opacity: 0.08 + t * 0.1 };
  }
  return null;
}

/** The more agitated of the two captains drives the pitch's ambient glow. */
export function pitchGlow(state: MatchState): OwnerGlow | null {
  const home = glowForOwner(state.ownerHome);
  const away = glowForOwner(state.ownerAway);
  if (!home) return away;
  if (!away) return home;
  return home.opacity >= away.opacity ? home : away;
}
