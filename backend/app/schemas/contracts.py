from datetime import datetime, timezone
from typing import Literal
from pydantic import BaseModel, Field

SystemMode = Literal["LIVE_AI", "SIMULATION", "DEMO"]
DepthLevel = Literal["NEAR", "MEDIUM", "FAR"]
MotionState = Literal["STATIC", "MOVING"]
Priority = Literal["LOW", "MEDIUM", "HIGH", "CRITICAL"]
Resolution = Literal["COARSE", "MEDIUM", "FINE", "VERY_FINE"]

class DetectedObject(BaseModel):
    id: int
    object_class: str = Field(serialization_alias="class")
    confidence: float
    bbox: tuple[float, float, float, float]
    center: tuple[float, float]
    estimatedDistance: float | None = None
    depthLevel: DepthLevel
    depthConfidence: float | None = None
    velocity: float | None = None
    motionState: MotionState
    direction: str | None = None
    semanticConfidence: float | None = None
    riskScore: float
    priority: Priority
    resolution: Resolution
    factors: dict[str, float]
    reason: str

class SpatialRegion(BaseModel):
    id: str
    x: float
    y: float
    width: float
    height: float
    depth: float | None = None
    priority: float
    resolution: Resolution
    objectId: int | None = None

class Metrics(BaseModel):
    fps: float | None = None
    inferenceLatencyMs: float | None = None
    endToEndLatencyMs: float | None = None
    cpuPercent: float | None = None
    memoryMb: float | None = None
    objectCount: int
    highPriorityRegions: int
    activeCells: int
    source: Literal["MEASURED", "DEMO", "UNAVAILABLE"]

class VirtualGridZone(BaseModel):
    id: str
    label: str
    distanceBand: str
    cellSizeCmEquivalent: int
    cellCount: int

class VirtualGridStats(BaseModel):
    basis: Literal["VISION_DERIVED_VIRTUAL_GRID"] = "VISION_DERIVED_VIRTUAL_GRID"
    fieldWidthMEquivalent: float
    fieldDepthMEquivalent: float
    uniformCellSizeCmEquivalent: int
    uniformCellCount: int
    adaptiveCellCount: int
    cellReductionPercent: float
    modeledUniformStorageKb: float
    modeledAdaptiveStorageKb: float
    modeledStorageReductionPercent: float
    zones: list[VirtualGridZone]

class SystemStatus(BaseModel):
    mode: SystemMode
    camera: Literal["CONNECTED", "UNAVAILABLE", "NOT_REQUESTED"]
    processing: Literal["LOCAL"] = "LOCAL"
    detector: str
    message: str | None = None

class PerceptionSnapshot(BaseModel):
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    objects: list[DetectedObject]
    spatial_regions: list[SpatialRegion]
    metrics: Metrics
    grid_stats: VirtualGridStats
    system_status: SystemStatus

class ConfigUpdate(BaseModel):
    mode: SystemMode | None = None
    cameraIndex: int | None = Field(default=None, ge=0, le=9)
