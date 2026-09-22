import { useEffect, useMemo, useState } from "react";
import { BarChart3, Info, Radio } from "lucide-react";
import { Header } from "./components/Header";
import { CameraViewer } from "./components/CameraViewer";
import { AdaptiveMap } from "./components/AdaptiveMap";
import { ObjectList } from "./components/ObjectList";
import { SmartFocusPanel } from "./components/SmartFocusPanel";
import { ComparisonView } from "./components/ComparisonView";
import { PerformancePanel } from "./components/PerformancePanel";
import { GridAllocationPanel } from "./components/GridAllocationPanel";
import { makeDemoSnapshot } from "./mock/demoScene";
import { usePerception } from "./hooks/usePerception";
import type { PerceptionSnapshot, SystemMode } from "./types/contracts";

export default function App() {
  const [mode, setMode] = useState<SystemMode>("DEMO");
  const [page, setPage] = useState<"DASHBOARD" | "PERFORMANCE">("DASHBOARD");
  const [elapsed, setElapsed] = useState(0);
  const [selectedId, setSelectedId] = useState<number | null>(17);
  const [controls, setControls] = useState({ detection: true, tracking: true, smartfocus: true, grid: true });
  const { liveSnapshot, backendConnected } = usePerception(mode);
  const [frameTick, setFrameTick] = useState(0);

  useEffect(() => {
    const started = performance.now();
    const tick = window.setInterval(() => setElapsed((performance.now() - started) / 1000), 250);
    return () => window.clearInterval(tick);
  }, []);

  useEffect(() => { if (mode !== "LIVE_AI") return; const timer = window.setInterval(() => setFrameTick(Date.now()), 350); return () => window.clearInterval(timer); }, [mode]);
  const fallback: PerceptionSnapshot = useMemo(() => makeDemoSnapshot(elapsed, mode), [elapsed, mode]);
  const snapshot: PerceptionSnapshot = liveSnapshot && backendConnected ? liveSnapshot : fallback;
  const selected = snapshot.objects.find((object) => object.id === selectedId) ?? snapshot.objects[0];
  useEffect(() => { if (selected && selected.id !== selectedId) setSelectedId(selected.id); }, [selected, selectedId]);

  return <main className="app-shell">
    <Header snapshot={snapshot} mode={mode} onModeChange={setMode} page={page} onPageChange={setPage} />
    {page === "DASHBOARD" ? <>
      <div className="main-grid">
        <CameraViewer objects={controls.detection ? snapshot.objects : []} selectedId={selectedId} onSelect={setSelectedId} mode={mode} frameUrl={mode === "LIVE_AI" && snapshot.system_status.camera === "CONNECTED" ? `/api/frame?t=${frameTick}` : null} controls={controls} onControl={(name) => setControls((current) => ({ ...current, [name]: !current[name as keyof typeof current] }))} />
        <AdaptiveMap objects={snapshot.objects} regions={snapshot.spatial_regions} selectedId={selectedId} onSelect={setSelectedId} />
        <aside className="right-rail"><ObjectList objects={snapshot.objects} selectedId={selectedId} onSelect={setSelectedId} /><SmartFocusPanel object={selected} /></aside>
      </div>
      <PerformancePanel metrics={snapshot.metrics} />
      <GridAllocationPanel stats={snapshot.grid_stats} />
      <div className="notice-strip"><Radio size={14} /><span><b>{mode === "DEMO" ? "DEMO DATA ACTIVE" : `${mode.replace("_", " ")} PREVIEW`}</b> {snapshot.system_status.message}</span><Info size={14} /><span>Depth and virtual detail are vision-derived estimates, not physical LiDAR measurements.</span></div>
    </> : <section className="performance-page"><div className="performance-title"><div><span className="eyebrow">FRACTUS PERFORMANCE</span><h2>Adaptive allocation telemetry</h2><p>Only values produced by the active local pipeline are shown as measurements.</p></div><BarChart3 size={30} /></div><PerformancePanel metrics={snapshot.metrics} /><GridAllocationPanel stats={snapshot.grid_stats} /><ComparisonView objects={snapshot.objects} /><div className="performance-note"><b>VIRTUAL GRID:</b> Cell and storage reduction figures are calculated from the displayed virtual grid model. FPS and inference latency only appear when the live local pipeline measures them.</div></section>}
  </main>;
}
