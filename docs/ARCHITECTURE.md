# Architecture

FRACTUS is a local vision prototype designed to demonstrate adaptive spatial allocation, not LiDAR reconstruction.

```text
MacBook RGB camera
  -> local YOLOv8n COCO detection (objects and vehicles)
  -> OpenCV person and structural-plane fallbacks
  -> centroid tracking
  -> bounding-box scale depth proxy (approximate)
  -> SmartFocus risk factors
  -> radial virtual-grid engine (10 / 25 / 50 cm-equivalent base bands)
  -> local 5 cm-equivalent focus refinements
  -> virtual adaptive-resolution regions
  -> FastAPI REST/WebSocket contract
  -> React camera overlay and estimated 2.5D scene
```

## Modes

- `LIVE_AI`: OpenCV captures the selected local camera. When `yolov8n.onnx` has been downloaded, it detects the standard COCO object set, including people, cars, bicycles, motorcycles, buses, trucks, chairs, backpacks, dogs, bottles, laptops, and many more. A wall-like plane is a separately labeled image-edge heuristic, not a COCO detection or 3D reconstruction.
- `SIMULATION`: a camera-safe presentation fallback. The adaptive objects are deterministic and labeled as such.
- `DEMO`: a repeatable 24-second scene: empty baseline, person, car, then chair.

The depth module estimates relative depth from detection-box scale. Its optional meter value is an uncalibrated visualization estimate and must not be used as a measurement.

## Virtual Radial Grid

The radial grid engine models a 24 m by 40 m camera-relative reference field. Its baseline uses 10 cm-equivalent cells through 10 m, 25 cm-equivalent cells through 30 m, and 50 cm-equivalent cells through 40 m. SmartFocus can replace a bounded region with 25, 10, or 5 cm-equivalent virtual cells according to its priority.

The engine calculates uniform and adaptive cell counts using the same declared field and a 16-byte virtual-cell layout. This is a reproducible modeled grid/storage comparison, not a LiDAR-derived physical map, calibrated distance, or observed device-memory measurement.

The backend uses a worker thread for camera capture and inference, while the frontend consumes state by WebSocket. Camera frames never leave the machine.
