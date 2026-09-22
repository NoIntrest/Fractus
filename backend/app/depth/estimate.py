from __future__ import annotations

def estimate_depth(box_height: float, frame_height: float, confidence: float) -> tuple[float, str, float]:
    """A bounding-box scale proxy, not calibrated physical ranging."""
    fraction = max(box_height / max(frame_height, 1), 0.03)
    estimate = max(1.2, min(15.0, 4.9 / fraction))
    if fraction >= 0.36:
        level = "NEAR"
    elif fraction >= 0.16:
        level = "MEDIUM"
    else:
        level = "FAR"
    depth_confidence = round(min(0.72, max(0.25, confidence * min(1.0, fraction * 2.4))), 2)
    return round(estimate, 1), level, depth_confidence
