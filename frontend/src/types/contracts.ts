export type SystemMode = "LIVE_AI" | "SIMULATION" | "DEMO";
export type DepthLevel = "NEAR" | "MEDIUM" | "FAR";
export type MotionState = "STATIC" | "MOVING";
export type Priority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type Resolution = "COARSE" | "MEDIUM" | "FINE" | "VERY_FINE";

export interface DetectedObject {
  id: number;
  class: string;
  confidence: number;
  bbox: [number, number, number, number];
  center: [number, number];
  estimatedDistance?: number;
  depthLevel: DepthLevel;
  depthConfidence?: number;
  velocity?: number;
  motionState: MotionState;
  direction?: string;
  semanticConfidence?: number;
  riskScore: number;
  priority: Priority;
  resolution: Resolution;
  factors: Record<string, number>;
  reason: string;
}

export interface SpatialRegion {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  depth?: number;
  priority: number;
  resolution: Resolution;
  objectId?: number;
}

export interface Metrics {
  fps: number | null;
  inferenceLatencyMs: number | null;
  endToEndLatencyMs: number | null;
  cpuPercent: number | null;
  memoryMb: number | null;
  objectCount: number;
  highPriorityRegions: number;
  activeCells: number;
  source: "MEASURED" | "DEMO" | "UNAVAILABLE";
}

export interface VirtualGridZone {
  id: string;
  label: string;
  distanceBand: string;
  cellSizeCmEquivalent: number;
  cellCount: number;
}

export interface VirtualGridStats {
  basis: "VISION_DERIVED_VIRTUAL_GRID";
  fieldWidthMEquivalent: number;
  fieldDepthMEquivalent: number;
  uniformCellSizeCmEquivalent: number;
  uniformCellCount: number;
  adaptiveCellCount: number;
  cellReductionPercent: number;
  modeledUniformStorageKb: number;
  modeledAdaptiveStorageKb: number;
  modeledStorageReductionPercent: number;
  zones: VirtualGridZone[];
}

export interface PerceptionSnapshot {
  timestamp: string;
  objects: DetectedObject[];
  spatial_regions: SpatialRegion[];
  metrics: Metrics;
  grid_stats: VirtualGridStats;
  system_status: {
    mode: SystemMode;
    camera: "CONNECTED" | "UNAVAILABLE" | "NOT_REQUESTED";
    processing: "LOCAL";
    detector: string;
    message?: string;
  };
}
