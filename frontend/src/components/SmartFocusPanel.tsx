import { ArrowDown, ArrowRight, CircleAlert, Focus, MoveRight } from "lucide-react";
import type { DetectedObject } from "../types/contracts";

const labels: Record<string, string> = { distance: "DISTANCE", semantic: "SEMANTIC", motion: "MOTION", safety: "SAFETY", confidence: "CONFIDENCE" };

export function SmartFocusPanel({ object }: { object: DetectedObject | undefined }) {
  if (!object) return <section className="smartfocus-panel panel"><div className="side-heading"><div><span className="eyebrow">04 / DECISION TRACE</span><h2>SmartFocus</h2></div></div><div className="focus-empty"><Focus size={22} /><p>No salient object selected</p><small>Select a detected object to inspect why Fractus changes its virtual spatial detail.</small></div></section>;
  return <section className="smartfocus-panel panel">
    <div className="side-heading"><div><span className="eyebrow">04 / DECISION TRACE</span><h2>SmartFocus</h2></div><Focus size={17} /></div>
    <div className="focus-subject"><div className="subject-glyph"><MoveRight size={21} /></div><div><b>{object.class.toUpperCase()} #{String(object.id).padStart(2, "0")}</b><span>{object.priority} PRIORITY</span></div><strong>{object.riskScore.toFixed(2)}</strong></div>
    <div className="focus-facts"><div><span>RELATIVE DEPTH</span><b>{object.depthLevel}</b><small>{object.estimatedDistance ? `~${object.estimatedDistance.toFixed(1)}m estimate` : "Estimate unavailable"}</small></div><div><span>MOTION</span><b>{object.motionState}</b><small>{object.velocity ? `~${object.velocity.toFixed(1)} m/s estimate` : "No relative motion"}</small></div><div><span>VIRTUAL DETAIL</span><b>{object.resolution.replace("_", " ")}</b><small>Adaptive allocation</small></div></div>
    <div className="factor-list">{Object.entries(object.factors).map(([key, value]) => <div className="factor" key={key}><span>{labels[key] || key}</span><div><i style={{ width: `${value * 100}%` }}></i></div><b>{Math.round(value * 100)}</b></div>)}</div>
    <div className="why-box"><CircleAlert size={15} /><div><span>WHY THIS DETAIL?</span><p>{object.reason}</p></div></div>
  </section>;
}
