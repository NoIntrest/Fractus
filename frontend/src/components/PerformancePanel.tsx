import { Cpu, Gauge, Grid2X2, Layers3, Timer } from "lucide-react";
import type { Metrics } from "../types/contracts";

function value(value: number | null, suffix = "") { return value === null ? "N/A" : `${value.toFixed(value % 1 ? 1 : 0)}${suffix}`; }
export function MetricCard({ label, value: metricValue, note, icon: Icon }: { label: string; value: string; note: string; icon: typeof Gauge }) {
  return <div className="metric-card"><div><span>{label}</span><b>{metricValue}</b><small>{note}</small></div><Icon size={17} /></div>;
}

export function PerformancePanel({ metrics }: { metrics: Metrics }) {
  const real = metrics.source === "MEASURED";
  return <section className="metrics-row">
    <MetricCard label="FPS" value={value(metrics.fps)} note={real ? "Measured pipeline rate" : "Unavailable in demo"} icon={Gauge} />
    <MetricCard label="INFERENCE" value={value(metrics.inferenceLatencyMs, " ms")} note={real ? "Model wall time" : "No model running"} icon={Timer} />
    <MetricCard label="OBJECTS" value={String(metrics.objectCount)} note="Current semantic tracks" icon={Layers3} />
    <MetricCard label="HIGH FOCUS" value={String(metrics.highPriorityRegions)} note="Fine-detail regions" icon={Grid2X2} />
    <MetricCard label="ACTIVE CELLS" value={String(metrics.activeCells)} note="Calculated virtual grid cells" icon={Cpu} />
  </section>;
}
