import type { DetectedObject, Resolution, SpatialRegion } from "../types/contracts";

const resolutionStyle: Record<Resolution, { color: string; size: number; steps: number }> = {
  COARSE: { color: "#789397", size: 42, steps: 2 },
  MEDIUM: { color: "#4dc8ff", size: 54, steps: 3 },
  FINE: { color: "#5de0d1", size: 68, steps: 5 },
  VERY_FINE: { color: "#ffb454", size: 84, steps: 8 }
};

function ResolutionGrid({ x, y, resolution, opacity = 1 }: { x: number; y: number; resolution: Resolution; opacity?: number }) {
  const { color, size, steps } = resolutionStyle[resolution];
  return <g opacity={opacity}>
    <ellipse cx={x} cy={y} rx={size} ry={size * .36} fill={color} opacity=".10" />
    {Array.from({ length: steps * 2 + 1 }, (_, i) => <line key={`v${i}`} x1={x - size + i * size / steps} x2={x - size + i * size / steps} y1={y - size * .36} y2={y + size * .36} stroke={color} strokeWidth="1" />)}
    {Array.from({ length: steps + 1 }, (_, i) => <line key={`h${i}`} x1={x - size} x2={x + size} y1={y - size * .36 + i * size * .72 / steps} y2={y - size * .36 + i * size * .72 / steps} stroke={color} strokeWidth="1" />)}
  </g>;
}

export function AdaptiveMap({ objects, regions, selectedId, onSelect }: { objects: DetectedObject[]; regions: SpatialRegion[]; selectedId: number | null; onSelect: (id: number) => void }) {
  const counts = regions.reduce<Record<Resolution, number>>((totals, region) => ({ ...totals, [region.resolution]: totals[region.resolution] + 1 }), { COARSE: 1, MEDIUM: 0, FINE: 0, VERY_FINE: 0 });
  return <section className="panel map-panel">
    <div className="panel-heading"><div><span className="eyebrow">02 / ADAPTIVE REPRESENTATION</span><h2>Estimated 2.5D Scene</h2></div><div className="map-key"><span><i className="key-coarse"></i>C {counts.COARSE}</span><span><i className="key-medium"></i>M {counts.MEDIUM}</span><span><i className="key-fine"></i>F {counts.FINE}</span><span><i className="key-very-fine"></i>VF {counts.VERY_FINE}</span></div></div>
    <div className="map-stage">
      <svg viewBox="0 0 860 560" role="img" aria-label="Vision-derived adaptive 2.5D spatial representation">
        <defs><linearGradient id="floorFade" x1="0" x2="0" y1="0" y2="1"><stop stopColor="#0c252b" stopOpacity=".18"/><stop offset="1" stopColor="#071214" stopOpacity=".02"/></linearGradient></defs>
        <path d="M430 85 L70 520 L790 520 Z" fill="url(#floorFade)" stroke="#24444a" strokeWidth="1" />
        {[0, 1, 2, 3, 4, 5, 6].map((n) => { const y = 145 + n * n * 8; return <path key={`r${n}`} d={`M${430 - (y - 85) * .83} ${y} H${430 + (y - 85) * .83}`} stroke="#1b3d43" strokeWidth="1" />; })}
        {[-3, -2, -1, 0, 1, 2, 3].map((n) => <path key={`c${n}`} d={`M430 85 L${430 + n * 118} 520`} stroke="#17373d" strokeWidth="1" />)}
        <path d="M430 85 V520" stroke="#31575c" strokeDasharray="5 6" />
        <text x="92" y="502" fill="#6f8586" fontSize="9" fontFamily="ui-monospace, monospace">COARSE BASE SCENE</text>
        {regions.map((region) => {
          const object = objects.find((item) => item.id === region.objectId);
          if (!object) return null;
          const x = 430 + ((object.center[0] / 1280) - .5) * 510;
          const y = 185 + Math.min(280, (object.estimatedDistance || 10) * 33);
          const selected = object.id === selectedId;
          const color = resolutionStyle[object.resolution].color;
          return <g key={region.id} className={selected ? "map-object selected" : "map-object"} onClick={() => onSelect(object.id)} style={{ cursor: "pointer" }}>
            {object.resolution === "VERY_FINE" && <><ResolutionGrid x={x} y={y} resolution="MEDIUM" opacity={.35} /><ResolutionGrid x={x} y={y} resolution="FINE" opacity={.58} /></>}
            {object.resolution === "FINE" && <ResolutionGrid x={x} y={y} resolution="MEDIUM" opacity={.4} />}
            <ResolutionGrid x={x} y={y} resolution={object.resolution} />
            <line x1={x} y1={y - 5} x2={x} y2={y - 45} stroke={color} /><circle cx={x} cy={y - 50} r="6" fill={color} /><text x={x + 13} y={y - 48} fill="#e4fbff" fontSize="12" fontFamily="ui-monospace, monospace">{object.class.toUpperCase()} #{object.id}</text><text x={x + 13} y={y - 31} fill={color} fontSize="10" fontFamily="ui-monospace, monospace">{object.resolution.replace("_", " ")}</text>
          </g>;
        })}
        {objects.length === 0 && <text x="430" y="310" textAnchor="middle" fill="#6e9398" fontFamily="ui-monospace, monospace" fontSize="13">COARSE BASELINE / NO SALIENT REGION</text>}
      </svg>
      <div className="map-axis x">X / LATERAL POSITION</div><div className="map-axis y">FORWARD / RELATIVE DEPTH</div><div className="map-hud"><span>VISION-DERIVED</span><b>NOT LIDAR</b></div>
    </div>
    <div className="resolution-legend"><span><i className="dot coarse"></i> COARSE <small>base scene</small></span><span><i className="dot medium"></i> MEDIUM <small>context</small></span><span><i className="dot fine"></i> FINE <small>high focus</small></span><span><i className="dot very-fine"></i> VERY FINE <small>critical core</small></span></div>
  </section>;
}
