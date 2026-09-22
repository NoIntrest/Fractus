import type { DetectedObject, VirtualGridStats } from "../types/contracts";

const fieldWidth = 24;
const fieldDepth = 40;
const bytesPerCell = 16;
const baseZones = [
  ["near", "NEAR BASE", "0-10 m equivalent", 10, .10],
  ["medium", "MEDIUM BASE", "10-30 m equivalent", 20, .25],
  ["far", "FAR BASE", "30-40 m equivalent", 10, .50]
] as const;
const focusCell = { COARSE: .50, MEDIUM: .25, FINE: .10, VERY_FINE: .05 } as const;
const focusArea = { COARSE: 2.25, MEDIUM: 4, FINE: 6.25, VERY_FINE: 9 } as const;
const baseCell = (distance?: number) => !distance || distance <= 10 ? .10 : distance <= 30 ? .25 : .50;

export function makeVirtualGridStats(objects: DetectedObject[]): VirtualGridStats {
  const uniformCellCount = Math.ceil(fieldWidth / .05) * Math.ceil(fieldDepth / .05);
  let adaptiveCellCount = 0;
  const zones: VirtualGridStats["zones"] = baseZones.map(([id, label, distanceBand, depth, cellSize]) => {
    const cellCount = Math.ceil(fieldWidth / cellSize) * Math.ceil(depth / cellSize);
    adaptiveCellCount += cellCount;
    return { id, label, distanceBand, cellSizeCmEquivalent: cellSize * 100, cellCount };
  });
  objects.forEach((object) => {
    const cellSize = focusCell[object.resolution];
    const delta = Math.max(0, Math.ceil(focusArea[object.resolution] / cellSize ** 2) - Math.ceil(focusArea[object.resolution] / baseCell(object.estimatedDistance) ** 2));
    if (delta) { adaptiveCellCount += delta; zones.push({ id: `focus-${object.id}`, label: `${object.class.toUpperCase()} #${object.id} FOCUS`, distanceBand: `${object.depthLevel} focus region`, cellSizeCmEquivalent: cellSize * 100, cellCount: delta }); }
  });
  const reduction = Number(((1 - adaptiveCellCount / uniformCellCount) * 100).toFixed(1));
  return { basis: "VISION_DERIVED_VIRTUAL_GRID", fieldWidthMEquivalent: fieldWidth, fieldDepthMEquivalent: fieldDepth, uniformCellSizeCmEquivalent: 5, uniformCellCount, adaptiveCellCount, cellReductionPercent: reduction, modeledUniformStorageKb: Number((uniformCellCount * bytesPerCell / 1024).toFixed(1)), modeledAdaptiveStorageKb: Number((adaptiveCellCount * bytesPerCell / 1024).toFixed(1)), modeledStorageReductionPercent: reduction, zones };
}
