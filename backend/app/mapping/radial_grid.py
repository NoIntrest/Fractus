from __future__ import annotations

from math import ceil
from backend.app.schemas.contracts import DetectedObject, VirtualGridStats, VirtualGridZone

FIELD_WIDTH_M = 24.0
FIELD_DEPTH_M = 40.0
UNIFORM_CELL_M = 0.05
BYTES_PER_VIRTUAL_CELL = 16

BASE_ZONES = (
    ("near", "NEAR BASE", "0-10 m equivalent", 10.0, 0.10),
    ("medium", "MEDIUM BASE", "10-30 m equivalent", 20.0, 0.25),
    ("far", "FAR BASE", "30-40 m equivalent", 10.0, 0.50),
)
FOCUS_CELL_M = {"COARSE": .50, "MEDIUM": .25, "FINE": .10, "VERY_FINE": .05}
FOCUS_AREA_M2 = {"COARSE": 2.25, "MEDIUM": 4.0, "FINE": 6.25, "VERY_FINE": 9.0}

def _base_cell_size(distance: float | None) -> float:
    if distance is None or distance <= 10:
        return .10
    if distance <= 30:
        return .25
    return .50

def build_virtual_grid_stats(objects: list[DetectedObject]) -> VirtualGridStats:
    """Calculate a reproducible virtual-grid allocation, not physical sensor cells."""
    uniform_cells = int(ceil(FIELD_WIDTH_M / UNIFORM_CELL_M) * ceil(FIELD_DEPTH_M / UNIFORM_CELL_M))
    zones: list[VirtualGridZone] = []
    adaptive_cells = 0
    for zone_id, label, distance_band, depth_m, cell_m in BASE_ZONES:
        cells = int(ceil(FIELD_WIDTH_M / cell_m) * ceil(depth_m / cell_m))
        adaptive_cells += cells
        zones.append(VirtualGridZone(id=zone_id, label=label, distanceBand=distance_band, cellSizeCmEquivalent=int(cell_m * 100), cellCount=cells))

    for item in objects:
        target_cell = FOCUS_CELL_M[item.resolution]
        baseline_cell = _base_cell_size(item.estimatedDistance)
        area = FOCUS_AREA_M2[item.resolution]
        refinement_cells = max(0, int(ceil(area / target_cell ** 2) - ceil(area / baseline_cell ** 2)))
        if refinement_cells:
            adaptive_cells += refinement_cells
            zones.append(VirtualGridZone(id=f"focus-{item.id}", label=f"{item.object_class.upper()} #{item.id} FOCUS", distanceBand=f"{item.depthLevel} focus region", cellSizeCmEquivalent=int(target_cell * 100), cellCount=refinement_cells))

    reduction = round((1 - adaptive_cells / uniform_cells) * 100, 1)
    uniform_kb = round(uniform_cells * BYTES_PER_VIRTUAL_CELL / 1024, 1)
    adaptive_kb = round(adaptive_cells * BYTES_PER_VIRTUAL_CELL / 1024, 1)
    return VirtualGridStats(fieldWidthMEquivalent=FIELD_WIDTH_M, fieldDepthMEquivalent=FIELD_DEPTH_M, uniformCellSizeCmEquivalent=5, uniformCellCount=uniform_cells, adaptiveCellCount=adaptive_cells, cellReductionPercent=reduction, modeledUniformStorageKb=uniform_kb, modeledAdaptiveStorageKb=adaptive_kb, modeledStorageReductionPercent=reduction, zones=zones)
