from __future__ import annotations
import platform
import threading
from datetime import datetime, timezone
from time import monotonic
import cv2
try:
    import psutil
except ImportError:
    psutil = None

from backend.app.depth import estimate_depth
from backend.app.detection import OpenCVSceneDetector
from backend.app.mapping import build_regions, build_virtual_grid_stats
from backend.app.schemas.contracts import DetectedObject, Metrics, PerceptionSnapshot, SystemStatus
from backend.app.smartfocus import score_object
from backend.app.tracking import CentroidTracker

class PerceptionPipeline:
    def __init__(self) -> None:
        self.mode = "DEMO"
        self.camera_index = 0
        self.camera = None
        self.last_frame = None
        self.detector = OpenCVSceneDetector()
        self.tracker = CentroidTracker()
        self.lock = threading.Lock()
        self.started = monotonic()
        self.last_inference_ms: float | None = None
        self.last_timestamp: float | None = None
        self.live_snapshot: PerceptionSnapshot | None = None
        self.thread: threading.Thread | None = None
        self.running = False

    def start(self) -> None:
        if self.running:
            return
        self.running = True
        self.thread = threading.Thread(target=self._run, daemon=True, name="fractus-perception")
        self.thread.start()

    def stop(self) -> None:
        self.running = False
        if self.camera is not None:
            self.camera.release()
            self.camera = None

    def set_config(self, mode: str | None = None, camera_index: int | None = None) -> None:
        with self.lock:
            if mode:
                self.mode = mode
            if camera_index is not None and camera_index != self.camera_index:
                self.camera_index = camera_index
                if self.camera is not None:
                    self.camera.release()
                    self.camera = None

    def _open_camera(self):
        if self.camera is not None and self.camera.isOpened():
            return True
        capture = cv2.VideoCapture(self.camera_index, cv2.CAP_AVFOUNDATION if platform.system() == "Darwin" else cv2.CAP_ANY)
        capture.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
        capture.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)
        if not capture.isOpened():
            capture.release()
            return False
        self.camera = capture
        return True

    def _run(self) -> None:
        while self.running:
            with self.lock:
                live_requested = self.mode == "LIVE_AI"
            if not live_requested:
                threading.Event().wait(0.1)
                continue
            if not self._open_camera():
                threading.Event().wait(0.75)
                continue
            ok, frame = self.camera.read()
            if not ok:
                threading.Event().wait(0.1)
                continue
            started = monotonic()
            detections = self.detector.detect(frame)
            tracked = self.tracker.update(detections)
            height, width = frame.shape[:2]
            objects: list[DetectedObject] = []
            for track in tracked:
                x, y, box_width, box_height = track["bbox"]
                distance, depth_level, depth_confidence = estimate_depth(box_height, height, track["confidence"])
                object_class = track["object_class"]
                focus = score_object(object_class, depth_level, track["confidence"], track["px_per_second"])
                cue_messages = {
                    "yolo-coco": f"Local YOLO COCO detector recognized a {object_class}.",
                    "frontal-face": "Frontal face cue indicates a stationary person; body extent and depth remain approximate.",
                    "full-body": "Full-body pedestrian cue detected locally.",
                    "structural-plane": "Wall-like structural plane inferred from long image edges; its depth is only a visual estimate."
                }
                cue = cue_messages.get(track["cue"], "Local visual cue detected.")
                objects.append(DetectedObject(id=track["id"], object_class=object_class, confidence=round(track["confidence"], 2), bbox=(round(x, 1), round(y, 1), round(box_width, 1), round(box_height, 1)), center=(round(track["center"][0], 1), round(track["center"][1], 1)), estimatedDistance=distance, depthLevel=depth_level, depthConfidence=depth_confidence, velocity=focus["velocity"], motionState=focus["motion_state"], direction="UNAVAILABLE", semanticConfidence=round(track["confidence"], 2), riskScore=focus["risk"], priority=focus["priority"], resolution=focus["resolution"], factors=focus["factors"], reason=f"{cue} {focus['reason']}"))
            regions, _ = build_regions(objects, width, height)
            grid_stats = build_virtual_grid_stats(objects)
            finished = monotonic()
            inference_ms = (finished - started) * 1000
            fps = 1 / max(finished - self.last_timestamp, 0.001) if self.last_timestamp else None
            self.last_timestamp = finished
            with self.lock:
                self.last_frame = frame.copy()
                self.last_inference_ms = inference_ms
                self.live_snapshot = PerceptionSnapshot(timestamp=datetime.now(timezone.utc), objects=objects, spatial_regions=regions, metrics=Metrics(fps=round(fps, 1) if fps else None, inferenceLatencyMs=round(inference_ms, 1), endToEndLatencyMs=round(inference_ms, 1), cpuPercent=round(psutil.cpu_percent() if psutil else 0, 1) if psutil else None, memoryMb=round(psutil.Process().memory_info().rss / 1024 / 1024, 1) if psutil else None, objectCount=len(objects), highPriorityRegions=sum(item.priority in {"HIGH", "CRITICAL"} for item in objects), activeCells=grid_stats.adaptiveCellCount, source="MEASURED"), grid_stats=grid_stats, system_status=SystemStatus(mode="LIVE_AI", camera="CONNECTED", detector=self.detector.name, message="Local multi-class inference is active. Depth is a scale-based estimate."))

    def _demo(self) -> PerceptionSnapshot:
        phase = (monotonic() - self.started) % 24
        objects: list[DetectedObject] = []
        if phase >= 3:
            x = 790 - min(1.0, (phase - 3) / 5) * 230
            objects.append(DetectedObject(id=17, object_class="person", confidence=.94, bbox=(x, 164, 176, 428), center=(x + 88, 378), estimatedDistance=2.4, depthLevel="NEAR", depthConfidence=.72, velocity=.8, motionState="MOVING", direction="LEFT", semanticConfidence=.94, riskScore=.91, priority="HIGH", resolution="VERY_FINE", factors={"distance":.95,"semantic":.92,"motion":.8,"safety":.96,"confidence":.94}, reason="Nearby moving safety-relevant object. Fractus assigns greater virtual spatial detail here."))
        if phase >= 9:
            objects.append(DetectedObject(id=4, object_class="car", confidence=.89, bbox=(148, 328, 318, 174), center=(307, 415), estimatedDistance=6.7, depthLevel="MEDIUM", depthConfidence=.66, velocity=.2, motionState="MOVING", direction="RIGHT", semanticConfidence=.89, riskScore=.63, priority="MEDIUM", resolution="FINE", factors={"distance":.57,"semantic":.82,"motion":.35,"safety":.78,"confidence":.89}, reason="Moving vehicle at medium relative depth. Fractus preserves useful detail without over-allocating the scene."))
        if phase >= 15:
            objects.append(DetectedObject(id=28, object_class="chair", confidence=.78, bbox=(1000, 374, 126, 172), center=(1063, 460), estimatedDistance=9.8, depthLevel="FAR", depthConfidence=.48, velocity=0, motionState="STATIC", direction="NONE", semanticConfidence=.78, riskScore=.24, priority="LOW", resolution="COARSE", factors={"distance":.22,"semantic":.18,"motion":0,"safety":.12,"confidence":.78}, reason="Static, far, low-safety-relevance object. Fractus keeps this region coarse."))
        if phase >= 18:
            objects.append(DetectedObject(id=33, object_class="backpack", confidence=.81, bbox=(624, 365, 122, 150), center=(685, 440), estimatedDistance=5.5, depthLevel="MEDIUM", depthConfidence=.55, velocity=0, motionState="STATIC", direction="NONE", semanticConfidence=.81, riskScore=.51, priority="MEDIUM", resolution="MEDIUM", factors={"distance":.57,"semantic":.42,"motion":.05,"safety":.35,"confidence":.81}, reason="Context object at medium relative depth. Fractus preserves medium virtual detail around this region."))
        regions, _ = build_regions(objects, 1280, 720)
        grid_stats = build_virtual_grid_stats(objects)
        return PerceptionSnapshot(objects=objects, spatial_regions=regions, metrics=Metrics(objectCount=len(objects), highPriorityRegions=sum(item.priority in {"HIGH", "CRITICAL"} for item in objects), activeCells=grid_stats.adaptiveCellCount, source="DEMO"), grid_stats=grid_stats, system_status=SystemStatus(mode="DEMO", camera="NOT_REQUESTED", detector="Deterministic presentation scene", message="Demo data is active. Camera inference is not being represented as live."))

    def snapshot(self) -> PerceptionSnapshot:
        with self.lock:
            mode = self.mode
            live = self.live_snapshot
            camera_open = self.camera is not None and self.camera.isOpened()
        if mode == "DEMO":
            return self._demo()
        if mode == "LIVE_AI" and live is not None:
            return live
        message = "Camera unavailable. Switch to Demo or Simulation mode." if mode == "LIVE_AI" and not camera_open else "Simulation mode uses camera presentation with deterministic spatial behavior."
        demo = self._demo()
        demo.system_status.mode = mode
        demo.system_status.camera = "UNAVAILABLE" if mode == "LIVE_AI" else "NOT_REQUESTED"
        demo.system_status.detector = "No live model running" if mode == "LIVE_AI" else "Deterministic adaptive simulation"
        demo.system_status.message = message
        return demo

    def jpeg_frame(self) -> bytes | None:
        with self.lock:
            frame = None if self.last_frame is None else self.last_frame.copy()
        if frame is None:
            return None
        ok, encoded = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, 82])
        return encoded.tobytes() if ok else None
