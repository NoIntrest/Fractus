from __future__ import annotations
from backend.app.schemas.contracts import DetectedObject, SpatialRegion

CELL_COUNTS = {"COARSE": 12, "MEDIUM": 32, "FINE": 90, "VERY_FINE": 180}

def build_regions(objects: list[DetectedObject], width: float, height: float) -> tuple[list[SpatialRegion], int]:
    regions = []
    for item in objects:
        x, y, box_width, box_height = item.bbox
        regions.append(SpatialRegion(id=f"focus-{item.id}", x=round(x / width, 3), y=round(y / height, 3), width=round(box_width / width, 3), height=round(box_height / height, 3), depth=item.estimatedDistance, priority=item.riskScore, resolution=item.resolution, objectId=item.id))
    active_cells = 96 + sum(CELL_COUNTS[region.resolution] for region in regions)
    return regions, active_cells
