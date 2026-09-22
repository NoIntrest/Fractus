from __future__ import annotations

SEMANTIC = {"person": 0.92, "car": 0.82, "bicycle": 0.84, "motorcycle": 0.9, "bus": 0.8, "truck": 0.82, "dog": 0.68, "chair": 0.18, "wall": 0.08, "backpack": 0.42, "dining table": 0.22, "laptop": 0.3, "cell phone": 0.28, "bottle": 0.2}

def score_object(object_class: str, depth_level: str, confidence: float, px_per_second: float) -> dict:
    distance = {"NEAR": 0.95, "MEDIUM": 0.57, "FAR": 0.22}[depth_level]
    semantic = SEMANTIC.get(object_class, 0.35)
    motion = min(0.85, px_per_second / 100) if px_per_second > 18 else 0.05
    safety = semantic if object_class in {"person", "car", "bicycle", "motorcycle", "bus", "truck"} else semantic * 0.55
    # Depth and current motion carry more influence than class alone. This preserves
    # contextual detail for a person without assigning every person maximum detail.
    risk = min(1.0, 0.42 * distance + 0.14 * semantic + 0.16 * motion + 0.15 * safety + 0.08 * confidence)
    if risk >= 0.86:
        priority, resolution = "CRITICAL", "VERY_FINE"
    elif risk >= 0.70:
        priority, resolution = "HIGH", "FINE"
    elif risk >= 0.48:
        priority, resolution = "MEDIUM", "MEDIUM"
    else:
        priority, resolution = "LOW", "COARSE"
    motion_state = "MOVING" if px_per_second > 18 else "STATIC"
    reason = f"{depth_level.title()} relative depth, {motion_state.lower()} {object_class}, and semantic safety relevance determine this virtual detail allocation."
    return {"risk": round(risk, 2), "priority": priority, "resolution": resolution, "motion_state": motion_state, "velocity": round(px_per_second / 85, 1), "factors": {"distance": round(distance, 2), "semantic": round(semantic, 2), "motion": round(motion, 2), "safety": round(safety, 2), "confidence": round(confidence, 2)}, "reason": reason}
