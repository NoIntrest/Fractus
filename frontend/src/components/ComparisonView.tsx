import type { DetectedObject } from "../types/contracts";

function MiniGrid({ adaptive, objects }: { adaptive: boolean; objects: DetectedObject[] }) {
  const focus = objects.find((item) => item.priority === "HIGH" || item.priority === "CRITICAL");
  return <svg className="mini-grid" viewBox="0 0 360 180" aria-hidden="true">
    <rect width="360" height="180" fill="#081315" />
    {Array.from({ length: adaptive ? 9 : 18 }, (_, y) => Array.from({ length: adaptive ? 14 : 18 }, (_, x) => {
      const dx = x / (adaptive ? 14 : 18) * 1280; const dy = y / (adaptive ? 9 : 18) * 720;
      const inFocus = adaptive && focus && Math.abs(dx - focus.center[0]) < 230 && Math.abs(dy - focus.center[1]) < 250;
      const cellW = inFocus ? 9 : 360 / (adaptive ? 14 : 18); const cellH = inFocus ? 8 : 180 / (adaptive ? 9 : 18);
      if (inFocus) return null;
      return <rect key={`${x}-${y}`} x={x * 360 / (adaptive ? 14 : 18)} y={y * 180 / (adaptive ? 9 : 18)} width={cellW - 1} height={cellH - 1} fill="#0d2023" stroke="#244448" strokeWidth=".5" />;
    }))}
    {adaptive && focus && <g>{Array.from({ length: 15 }, (_, y) => Array.from({ length: 19 }, (_, x) => <rect key={`${x}-${y}`} x={focus.center[0] / 1280 * 360 - 76 + x * 8} y={focus.center[1] / 720 * 180 - 56 + y * 7.5} width="7" height="6.5" fill="#3a3425" stroke="#ffb454" strokeOpacity=".55" strokeWidth=".45" />))}<circle cx={focus.center[0] / 1280 * 360} cy={focus.center[1] / 720 * 180} r="5" fill="#ffb454" /></g>}
  </svg>;
}

export function ComparisonView({ objects }: { objects: DetectedObject[] }) {
  return <section className="comparison"><div className="comparison-heading"><div><span className="eyebrow">REPRESENTATION COMPARISON</span><h2>Uniform Detail vs Fractus Adaptive Detail</h2></div><p>Same scene, different allocation policy.</p></div><div className="comparison-grids"><div><span>UNIFORM REPRESENTATION</span><MiniGrid adaptive={false} objects={objects} /><small>Every region receives the same spatial detail.</small></div><div className="adaptive-comparison"><span>FRACTUS ADAPTIVE REPRESENTATION</span><MiniGrid adaptive objects={objects} /><small>Fine detail concentrates around meaningful movement.</small></div></div></section>;
}
