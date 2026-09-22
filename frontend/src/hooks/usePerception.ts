import { useEffect, useState } from "react";
import { connectPerception, setMode } from "../services/api";
import type { PerceptionSnapshot, SystemMode } from "../types/contracts";

export function usePerception(mode: SystemMode) {
  const [liveSnapshot, setLiveSnapshot] = useState<PerceptionSnapshot | null>(null);
  const [backendConnected, setBackendConnected] = useState(false);
  useEffect(() => {
    let alive = true;
    setMode(mode).catch(() => undefined);
    const socket = connectPerception((snapshot) => { if (alive) { setLiveSnapshot(snapshot); setBackendConnected(true); } }, () => { if (alive) setBackendConnected(false); });
    return () => { alive = false; socket.close(); };
  }, [mode]);
  return { liveSnapshot, backendConnected };
}
