from __future__ import annotations
from dataclasses import dataclass
from math import hypot
from time import monotonic

@dataclass
class Track:
    id: int
    center: tuple[float, float]
    previous_center: tuple[float, float]
    updated_at: float
    object_class: str
    misses: int = 0

class CentroidTracker:
    def __init__(self) -> None:
        self.tracks: dict[int, Track] = {}
        self.next_id = 17

    def update(self, detections: list[tuple[float, float, float, float, float, str, str]]) -> list[dict]:
        now = monotonic()
        available = set(self.tracks)
        result: list[dict] = []
        for x, y, w, h, confidence, object_class, cue in detections:
            center = (x + w / 2, y + h / 2)
            matching = [ident for ident in available if self.tracks[ident].object_class == object_class]
            best = min(matching, key=lambda ident: hypot(center[0] - self.tracks[ident].center[0], center[1] - self.tracks[ident].center[1]), default=None)
            if best is not None and hypot(center[0] - self.tracks[best].center[0], center[1] - self.tracks[best].center[1]) < 140:
                track = self.tracks[best]
                available.remove(best)
                elapsed = max(now - track.updated_at, 0.001)
                px_per_second = hypot(center[0] - track.center[0], center[1] - track.center[1]) / elapsed
                track.previous_center, track.center, track.updated_at, track.misses = track.center, center, now, 0
            else:
                track = Track(self.next_id, center, center, now, object_class)
                self.tracks[track.id] = track
                self.next_id += 1
                px_per_second = 0.0
            result.append({"id": track.id, "bbox": (x, y, w, h), "center": center, "confidence": confidence, "px_per_second": px_per_second, "object_class": object_class, "cue": cue})
        for ident in available:
            self.tracks[ident].misses += 1
        self.tracks = {ident: track for ident, track in self.tracks.items() if track.misses < 12}
        return result
