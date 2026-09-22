import type { SystemMode } from "../types/contracts";

const options: Array<[SystemMode, string]> = [["LIVE_AI", "LIVE AI"], ["SIMULATION", "SIMULATION"], ["DEMO", "DEMO"]];

export function ModeSelector({ mode, onChange }: { mode: SystemMode; onChange: (mode: SystemMode) => void }) {
  return <div className="mode-selector" aria-label="Prototype mode">
    {options.map(([value, label]) => <button key={value} className={mode === value ? "active" : ""} onClick={() => onChange(value)}>{label}</button>)}
  </div>;
}
