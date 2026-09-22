import type { CSSProperties } from "react";
import { Crosshair, Grid3X3, ScanLine, Sparkles } from "lucide-react";
import type { DetectedObject, SystemMode } from "../types/contracts";

const color = (priority: DetectedObject["priority"]) => priority === "HIGH" || priority === "CRITICAL" ? "#ffb454" : priority === "MEDIUM" ? "#5bc9ff" : "#91a8ac";

export function CameraViewer({ objects, selectedId, onSelect, mode, frameUrl, controls, onControl }: {
  objects: DetectedObject[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  mode: SystemMode;
  frameUrl?: string | null;
  controls: Record<string, boolean>;
  onControl: (name: string) => void;
}) {
  return <section className="panel camera-panel">
    <div className="panel-heading"><div><span className="eyebrow">01 / INPUT</span><h2>Camera Projection</h2></div><span className="source-tag">{mode === "DEMO" || mode === "SIMULATION" ? "DETERMINISTIC INPUT" : frameUrl ? "LIVE RGB INPUT" : "CAMERA PENDING"}</span></div>
    <div className="camera-stage">
      <div className="camera-scene">{frameUrl ? <img className="live-frame" src={frameUrl} alt="Live MacBook camera frame processed locally" /> : <><div className="horizon"></div><div className="scene-floor"></div><div className="scene-building left"></div><div className="scene-building right"></div><div className="scene-light"></div><div className="scene-car"></div><div className="scene-person"></div></>}</div>
      <div className="scan-lines"></div>
      <div className="camera-hud top-left">CAM 01 <span>1280 x 720</span></div><div className="camera-hud top-right">RGB <span>LOCAL</span></div>
      {objects.map((object) => {
        const [x, y, w, h] = object.bbox;
        const selected = object.id === selectedId;
        return <button key={object.id} onClick={() => onSelect(object.id)} className={`detection-box ${selected ? "selected" : ""}`} style={{ left: `${x / 12.8}%`, top: `${y / 7.2}%`, width: `${w / 12.8}%`, height: `${h / 7.2}%`, "--object-color": color(object.priority) } as CSSProperties}>
          <span className="box-corner tl"></span><span className="box-corner tr"></span><span className="box-corner bl"></span><span className="box-corner br"></span>
          <span className="detection-label"><b>{object.class.toUpperCase()} #{String(object.id).padStart(2, "0")}</b><em>{object.priority} / {Math.round(object.confidence * 100)}%</em></span>
        </button>;
      })}
      {objects.length === 0 && <div className="camera-empty"><ScanLine size={20} /><span>SCANNING SCENE</span><small>Awaiting salient objects</small></div>}
      <div className="camera-foot"><span><Crosshair size={13} /> SMARTFOCUS {controls.smartfocus ? "ON" : "OFF"}</span><span>{mode === "DEMO" ? "DEMO TIMELINE" : "CAMERA PIPELINE"}</span></div>
    </div>
    <div className="visual-controls">
      {[["detection", "Detection", ScanLine], ["tracking", "Tracking", Crosshair], ["smartfocus", "SmartFocus", Sparkles], ["grid", "Grid", Grid3X3]].map(([key, label, Icon]) => <button key={key as string} className={controls[key as string] ? "on" : ""} onClick={() => onControl(key as string)}><Icon size={13} /> {label as string}</button>)}
    </div>
  </section>;
}
