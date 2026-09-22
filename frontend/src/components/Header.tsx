import { Activity, CircleDotDashed, LockKeyhole, Network, Video } from "lucide-react";
import type { PerceptionSnapshot, SystemMode } from "../types/contracts";
import { ModeSelector } from "./ModeSelector";

export function Header({ snapshot, mode, onModeChange, page, onPageChange }: {
  snapshot: PerceptionSnapshot;
  mode: SystemMode;
  onModeChange: (mode: SystemMode) => void;
  page: "DASHBOARD" | "PERFORMANCE";
  onPageChange: (page: "DASHBOARD" | "PERFORMANCE") => void;
}) {
  const isActive = mode === "DEMO" || snapshot.system_status.camera === "CONNECTED";
  return <header className="app-header">
    <div className="brand">
      <div className="brand-mark"><span></span><span></span><span></span></div>
      <div><h1>FRACTUS</h1><p>CAMERA-BASED PERCEPTION</p></div>
    </div>
    <nav className="top-tabs" aria-label="Application views">
      <button className={page === "DASHBOARD" ? "selected" : ""} onClick={() => onPageChange("DASHBOARD")}>PERCEPTION</button>
      <button className={page === "PERFORMANCE" ? "selected" : ""} onClick={() => onPageChange("PERFORMANCE")}>PERFORMANCE</button>
    </nav>
    <div className="header-right">
      <div className="header-status"><Activity size={14} className={isActive ? "status-live" : "status-warn"} /><span>{isActive ? "SYSTEM ACTIVE" : "CAMERA UNAVAILABLE"}</span></div>
      <div className="header-meta"><Video size={13} /> <span>{mode === "DEMO" ? "Demo scene" : snapshot.system_status.camera === "CONNECTED" ? "MacBook Camera" : mode === "SIMULATION" ? "Simulated behavior" : "Camera pending"}</span></div>
      <div className="header-meta"><LockKeyhole size={13} /> <span>LOCAL PROCESSING</span></div>
      <ModeSelector mode={mode} onChange={onModeChange} />
    </div>
  </header>;
}
