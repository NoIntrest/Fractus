# API Contract

All endpoints are local at `http://127.0.0.1:8000`.

| Endpoint | Purpose |
| --- | --- |
| `GET /api/status` | Full snapshot plus local platform flags. |
| `GET /api/metrics` | Current metrics only. Null means unavailable. |
| `GET /api/objects` | Current tracked semantic objects. |
| `GET /api/frame` | Latest JPEG from LIVE AI. Returns 404 when unavailable. |
| `GET /api/config` | Active mode and camera index. |
| `PUT /api/config` | Updates `{ mode, cameraIndex }`. |
| `WS /ws/perception` | Streams a `PerceptionSnapshot` about five times per second. |

`DetectedObject.class` is a semantic label produced by the active source. `estimatedDistance` and `depthLevel` are approximate vision-derived estimates, never LiDAR depth. `Metrics.source` distinguishes `MEASURED`, `DEMO`, and `UNAVAILABLE`. `grid_stats` exposes the calculated virtual radial grid; its cell sizes, storage, and reductions are explicitly modeled equivalents rather than physical LiDAR or RAM measurements.

```json
{
  "timestamp": "2026-09-08T12:00:00Z",
  "objects": [],
  "spatial_regions": [],
  "metrics": { "fps": null, "objectCount": 0, "source": "DEMO" },
  "grid_stats": { "basis": "VISION_DERIVED_VIRTUAL_GRID", "uniformCellCount": 384000, "adaptiveCellCount": 32640, "cellReductionPercent": 91.5 },
  "system_status": { "mode": "DEMO", "camera": "NOT_REQUESTED", "processing": "LOCAL" }
}
```
