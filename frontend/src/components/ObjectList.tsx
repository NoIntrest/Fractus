import type { DetectedObject } from "../types/contracts";

const priorityDot = (priority: DetectedObject["priority"]) => priority === "HIGH" || priority === "CRITICAL" ? "hot" : priority === "MEDIUM" ? "cool" : "muted";

export function ObjectList({ objects, selectedId, onSelect }: { objects: DetectedObject[]; selectedId: number | null; onSelect: (id: number) => void }) {
  return <section className="object-list">
    <div className="side-heading"><div><span className="eyebrow">03 / SEMANTIC TRACKS</span><h2>Detected Objects</h2></div><span className="count-badge">{objects.length}</span></div>
    <div className="object-cards">
      {objects.map((object) => <button className={`object-card ${object.id === selectedId ? "selected" : ""}`} key={object.id} onClick={() => onSelect(object.id)}>
        <div className="object-title"><span className={`priority-dot ${priorityDot(object.priority)}`}></span><b>{object.class.toUpperCase()} #{String(object.id).padStart(2, "0")}</b><span>{Math.round(object.confidence * 100)}%</span></div>
        <div className="object-details"><span>{object.depthLevel}</span><span>{object.motionState}</span></div>
        <div className="object-score"><span>RISK</span><b>{object.riskScore.toFixed(2)}</b><span>DETAIL</span><b className="object-resolution">{object.resolution.replace("_", " ")}</b></div>
      </button>)}
      {objects.length === 0 && <div className="empty-objects">No priority tracks yet.<br /><small>Coarse virtual detail is retained.</small></div>}
    </div>
  </section>;
}
