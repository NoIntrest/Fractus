import { ArrowRight, Database, Grid3X3 } from "lucide-react";
import type { VirtualGridStats } from "../types/contracts";

const formatCells = (count: number) => new Intl.NumberFormat("en-US").format(count);

export function GridAllocationPanel({ stats }: { stats: VirtualGridStats }) {
  return <section className="grid-allocation">
    <div className="grid-allocation-heading"><div><span className="eyebrow">VIRTUAL RADIAL GRID ENGINE</span><h2>Uniform 5 cm-equivalent vs adaptive allocation</h2></div><span>VISION-DERIVED MODEL</span></div>
    <div className="grid-allocation-main">
      <div className="grid-total"><span>UNIFORM BASELINE</span><b>{formatCells(stats.uniformCellCount)}</b><small>{stats.uniformCellSizeCmEquivalent} cm-equivalent cells across {stats.fieldWidthMEquivalent} m x {stats.fieldDepthMEquivalent} m reference field</small></div>
      <ArrowRight size={22} />
      <div className="grid-total adaptive"><span>FRACTUS ADAPTIVE</span><b>{formatCells(stats.adaptiveCellCount)}</b><small>Radial base bands plus SmartFocus refinements</small></div>
      <div className="grid-reduction"><strong>{stats.cellReductionPercent}%</strong><span>FEWER VIRTUAL CELLS</span><small>{stats.modeledUniformStorageKb.toLocaleString()} KB <ArrowRight size={11} /> {stats.modeledAdaptiveStorageKb.toLocaleString()} KB modeled map storage</small></div>
    </div>
    <div className="grid-zones">{stats.zones.map((zone) => <div className="grid-zone" key={zone.id}><Grid3X3 size={13} /><div><b>{zone.label}</b><span>{zone.distanceBand}</span></div><em>{zone.cellSizeCmEquivalent} cm eq.</em><strong>{formatCells(zone.cellCount)}</strong></div>)}</div>
    <div className="grid-disclaimer"><Database size={13} /> These are calculated virtual-grid allocations using uncalibrated vision depth. They are not LiDAR measurements or observed device-memory usage.</div>
  </section>;
}
