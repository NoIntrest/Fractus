import type { DetectedObject, PerceptionSnapshot, SpatialRegion, SystemMode } from "../types/contracts";
import { makeVirtualGridStats } from "./virtualGrid";

const cellWeight = { COARSE: 12, MEDIUM: 32, FINE: 90, VERY_FINE: 180 } as const;

function regionFor(object: DetectedObject): SpatialRegion {
  const [x, y, width, height] = object.bbox;
  return {
    id: `focus-${object.id}`,
    x: x / 1280,
    y: y / 720,
    width: width / 1280,
    height: height / 720,
    depth: object.estimatedDistance,
    priority: object.riskScore,
    resolution: object.resolution,
    objectId: object.id
  };
}

export function makeDemoSnapshot(elapsedSeconds: number, mode: SystemMode = "DEMO"): PerceptionSnapshot {
  const phase = elapsedSeconds % 24;
  const objects: DetectedObject[] = [];

  if (phase >= 3) {
    const walking = Math.min(1, Math.max(0, (phase - 3) / 5));
    const x = 790 - walking * 230;
    objects.push({
      id: 17,
      class: "person",
      confidence: 0.94,
      bbox: [x, 164, 176, 428],
      center: [x + 88, 378],
      estimatedDistance: 2.4,
      depthLevel: "NEAR",
      depthConfidence: 0.72,
      velocity: 0.8,
      motionState: "MOVING",
      direction: "LEFT",
      semanticConfidence: 0.94,
      riskScore: 0.91,
      priority: "HIGH",
      resolution: "VERY_FINE",
      factors: { distance: 0.95, semantic: 0.92, motion: 0.8, safety: 0.96, confidence: 0.94 },
      reason: "Nearby moving safety-relevant object. Fractus assigns greater virtual spatial detail here."
    });
  }

  if (phase >= 9) {
    objects.push({
      id: 4,
      class: "car",
      confidence: 0.89,
      bbox: [148, 328, 318, 174],
      center: [307, 415],
      estimatedDistance: 6.7,
      depthLevel: "MEDIUM",
      depthConfidence: 0.66,
      velocity: 0.2,
      motionState: "MOVING",
      direction: "RIGHT",
      semanticConfidence: 0.89,
      riskScore: 0.63,
      priority: "MEDIUM",
      resolution: "FINE",
      factors: { distance: 0.57, semantic: 0.82, motion: 0.35, safety: 0.78, confidence: 0.89 },
      reason: "Moving vehicle at medium relative depth. Fractus preserves useful detail without over-allocating the scene."
    });
  }

  if (phase >= 15) {
    objects.push({
      id: 28,
      class: "chair",
      confidence: 0.78,
      bbox: [1000, 374, 126, 172],
      center: [1063, 460],
      estimatedDistance: 9.8,
      depthLevel: "FAR",
      depthConfidence: 0.48,
      velocity: 0,
      motionState: "STATIC",
      direction: "NONE",
      semanticConfidence: 0.78,
      riskScore: 0.24,
      priority: "LOW",
      resolution: "COARSE",
      factors: { distance: 0.22, semantic: 0.18, motion: 0, safety: 0.12, confidence: 0.78 },
      reason: "Static, far, low-safety-relevance object. Fractus keeps this region coarse."
    });
  }

  if (phase >= 18) {
    objects.push({
      id: 33,
      class: "backpack",
      confidence: 0.81,
      bbox: [624, 365, 122, 150],
      center: [685, 440],
      estimatedDistance: 5.5,
      depthLevel: "MEDIUM",
      depthConfidence: 0.55,
      velocity: 0,
      motionState: "STATIC",
      direction: "NONE",
      semanticConfidence: 0.81,
      riskScore: 0.51,
      priority: "MEDIUM",
      resolution: "MEDIUM",
      factors: { distance: 0.57, semantic: 0.42, motion: 0.05, safety: 0.35, confidence: 0.81 },
      reason: "Context object at medium relative depth. Fractus preserves medium virtual detail around this region."
    });
  }

  const spatial_regions = objects.map(regionFor);
  const grid_stats = makeVirtualGridStats(objects);
  return {
    timestamp: new Date().toISOString(),
    objects,
    spatial_regions,
    metrics: {
      fps: null,
      inferenceLatencyMs: null,
      endToEndLatencyMs: null,
      cpuPercent: null,
      memoryMb: null,
      objectCount: objects.length,
      highPriorityRegions: objects.filter((object) => object.priority === "HIGH" || object.priority === "CRITICAL").length,
      activeCells: grid_stats.adaptiveCellCount,
      source: "DEMO"
    },
    grid_stats,
    system_status: {
      mode,
      camera: "NOT_REQUESTED",
      processing: "LOCAL",
      detector: "Deterministic presentation scene",
      message: "Demo data is active. Camera inference is not being represented as live."
    }
  };
}
