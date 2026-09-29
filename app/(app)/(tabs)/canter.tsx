import { useState } from "react";

import { CanterHomeScreen } from "@/canter/screens/CanterHomeScreen";
import { CanterMatchScreen } from "@/canter/screens/CanterMatchScreen";

export default function CanterTabScreen() {
  const [inMatch, setInMatch] = useState(false);

  if (inMatch) {
    return <CanterMatchScreen onExit={() => setInMatch(false)} />;
  }

  return <CanterHomeScreen onPlay={() => setInMatch(true)} />;
}
