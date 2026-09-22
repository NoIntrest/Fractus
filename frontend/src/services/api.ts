import type { PerceptionSnapshot, SystemMode } from "../types/contracts";

export async function setMode(mode: SystemMode) {
  const response = await fetch("/api/config", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mode }) });
  if (!response.ok) throw new Error("Backend configuration request failed");
  return response.json();
}

export function connectPerception(onSnapshot: (snapshot: PerceptionSnapshot) => void, onFailure: () => void) {
  const protocol = window.location.protocol === "https:" ? "wss" : "ws";
  const socket = new WebSocket(`${protocol}://${window.location.host}/ws/perception`);
  socket.onmessage = (event) => onSnapshot(JSON.parse(event.data) as PerceptionSnapshot);
  socket.onerror = onFailure;
  return socket;
}
